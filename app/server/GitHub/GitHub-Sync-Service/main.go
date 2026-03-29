package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	"github.com/google/go-github/v60/github"
	"github.com/QuestraDigital/goServices/GitHub-Sync-Service/notificationClient"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type GitHubAccount struct {
	ID           primitive.ObjectID `bson:"_id"`
	UserID       string             `bson:"userId"`
	PAT          string             `bson:"pat"`
	Owner        string             `bson:"owner"`
	SyncInterval int                `bson:"syncInterval"`
}

type Repository struct {
	ID        int64              `bson:"repoId"`
	AccountID primitive.ObjectID `bson:"accountId"`
	Name      string             `bson:"name"`
	Owner     string             `bson:"owner"`
	Enabled   bool               `bson:"enabled"`
}

type Step struct {
	Name        string    `bson:"name" json:"name"`
	Status      string    `bson:"status" json:"status"`
	Conclusion  string    `bson:"conclusion" json:"conclusion"`
	Number      int64     `bson:"number" json:"number"`
	StartedAt   time.Time `bson:"startedAt" json:"startedAt"`
	CompletedAt time.Time `bson:"completedAt" json:"completedAt"`
}

type Job struct {
	ID          int64     `bson:"id" json:"id"`
	Name        string    `bson:"name" json:"name"`
	Status      string    `bson:"status" json:"status"`
	Conclusion  string    `bson:"conclusion" json:"conclusion"`
	StartedAt   time.Time `bson:"startedAt" json:"startedAt"`
	CompletedAt time.Time `bson:"completedAt" json:"completedAt"`
	Steps       []Step    `bson:"steps" json:"steps"`
}

type WorkflowRun struct {
	RunID         int64              `bson:"runId" json:"runId"`
	RepoID        int64              `bson:"repoId" json:"repoId"`
	AccountID     primitive.ObjectID `bson:"accountId" json:"accountId"`
	Status        string             `bson:"status" json:"status"`
	Conclusion    string             `bson:"conclusion" json:"conclusion"`
	StartedAt     time.Time          `bson:"startedAt" json:"startedAt"`
	UpdatedAt     time.Time          `bson:"updatedAt" json:"updatedAt"`
	Duration      float64            `bson:"duration" json:"duration"`
	HTMLURL       string             `bson:"htmlUrl" json:"htmlUrl"`
	WorkflowName  string             `bson:"workflowName" json:"workflowName"`
	HeadSHA       string             `bson:"headSha" json:"headSha"`
	Jobs          []Job              `bson:"jobs" json:"jobs"`
	AnomalyScore  float64            `bson:"anomalyScore" json:"anomalyScore"`
	AnomalyReason string             `bson:"anomalyReason" json:"anomalyReason"`
}

type GitHubIssue struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	RunID       int64              `bson:"runId" json:"runId"`
	RepoName    string             `bson:"repoName" json:"repoName"`
	RepoOwner   string             `bson:"repoOwner" json:"repoOwner"`
	IssueNumber int                `bson:"issueNumber" json:"issueNumber"`
	IssueURL    string             `bson:"issueUrl" json:"issueUrl"`
	Title       string             `bson:"title" json:"title"`
	Body        string             `bson:"body" json:"body"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
	Status      string             `bson:"status" json:"status"` // "open", "closed"
}

const defaultSyncInterval = 120 // 120 seconds to prevent rate limits

func main() {
	mongoURL := os.Getenv("MONGO_URL")
	if mongoURL == "" {
		mongoURL = "mongodb://mongouser:mongopassword@localhost:27017/admin"
	}

	client, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(mongoURL))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(context.TODO())

	// Create TTL Index for 14-day data retention
	ensureTTLIndex(client)

	log.Println("⚡ GitHub Real-Time Sync Service Started...")

	// Run a per-account polling loop that respects each account's syncInterval
	runPollingLoop(client)
}

func ensureTTLIndex(client *mongo.Client) {
	coll := client.Database("admin").Collection("github_runs")
	// First, try to drop the old dangerous TTL index on updatedAt (if it exists)
	_, _ = coll.Indexes().DropOne(context.TODO(), "updatedAt_1")
	
	// Create a safe TTL index on syncedAt — this is the time WE stored the run,
	// not when GitHub last touched it. 90 days retention.
	indexModel := mongo.IndexModel{
		Keys:    bson.M{"syncedAt": 1},
		Options: options.Index().SetExpireAfterSeconds(7776000), // 90 days
	}
	_, err := coll.Indexes().CreateOne(context.TODO(), indexModel)
	if err != nil {
		log.Printf("Warning: Could not create TTL index on syncedAt: %v", err)
	}
}

func runPollingLoop(client *mongo.Client) {
	running := make(map[primitive.ObjectID]bool)
	mu := sync.Mutex{}

	for {
		accounts := fetchAllAccounts(client)
		for _, acc := range accounts {
			mu.Lock()
			if running[acc.ID] {
				mu.Unlock()
				continue
			}
			running[acc.ID] = true
			mu.Unlock()

			go func(a GitHubAccount) {
				defer func() {
					mu.Lock()
					delete(running, a.ID)
					mu.Unlock()
				}()

				interval := a.SyncInterval
				if interval < 1 {
					interval = defaultSyncInterval
				}
				ticker := time.NewTicker(time.Duration(interval) * time.Second)
				defer ticker.Stop()

				log.Printf("[Sync] Started polling account %s (owner: %s) every %ds", a.ID.Hex(), a.Owner, interval)

				syncAccount(client, a)
				for range ticker.C {
					syncAccount(client, a)
				}
			}(acc)
		}
		time.Sleep(30 * time.Second)
	}
}

func fetchAllAccounts(client *mongo.Client) []GitHubAccount {
	coll := client.Database("admin").Collection("github_accounts")
	cursor, err := coll.Find(context.TODO(), bson.M{})
	if err != nil {
		log.Printf("[Sync] Error fetching accounts: %v", err)
		return nil
	}
	var accounts []GitHubAccount
	_ = cursor.All(context.TODO(), &accounts)
	return accounts
}

func syncAccount(client *mongo.Client, acc GitHubAccount) {
	db := client.Database("admin")
	reposColl := db.Collection("github_repos")
	runsColl := db.Collection("github_runs")
	issuesColl := db.Collection("github_issues")

	cursor, err := reposColl.Find(context.TODO(), bson.M{"accountId": acc.ID, "enabled": true})
	if err != nil {
		return
	}
	var repos []Repository
	_ = cursor.All(context.TODO(), &repos)

	if len(repos) == 0 {
		return
	}

	ghClient := github.NewClient(nil).WithAuthToken(acc.PAT)

	for _, repo := range repos {
		owner := repo.Owner
		if owner == "" {
			owner = acc.Owner
		}

		workflowRuns, _, err := ghClient.Actions.ListRepositoryWorkflowRuns(
			context.TODO(), owner, repo.Name,
			&github.ListWorkflowRunsOptions{ListOptions: github.ListOptions{PerPage: 10}},
		)
		if err != nil {
			log.Printf("[Sync] Error fetching runs for %s/%s: %v", owner, repo.Name, err)
			continue
		}

		for _, run := range workflowRuns.WorkflowRuns {
			// OPTIMIZATION: Check if we already have this run and if it's completed
			var existingRun WorkflowRun
			err := runsColl.FindOne(context.TODO(), bson.M{"runId": run.GetID()}).Decode(&existingRun)
			
			// Only fetch jobs if:
			// 1. Run doesn't exist in our DB
			// 2. Run exists but was not 'completed' (i.e. status was in_progress/queued)
			// 3. Run exists but has NO jobs data
			needsJobUpdate := err == mongo.ErrNoDocuments || 
							 existingRun.Status != "completed" || 
							 len(existingRun.Jobs) == 0

			var dbJobs []Job
			if needsJobUpdate {
				jobs, _, _ := ghClient.Actions.ListWorkflowJobs(context.TODO(), owner, repo.Name, run.GetID(), nil)
				if jobs != nil {
					for _, j := range jobs.Jobs {
						var dbSteps []Step
						for _, s := range j.Steps {
							dbSteps = append(dbSteps, Step{
								Name:        s.GetName(),
								Status:      s.GetStatus(),
								Conclusion:  s.GetConclusion(),
								Number:      s.GetNumber(),
								StartedAt:   s.GetStartedAt().Time,
								CompletedAt: s.GetCompletedAt().Time,
							})
						}
						dbJobs = append(dbJobs, Job{
							ID:          j.GetID(),
							Name:        j.GetName(),
							Status:      j.GetStatus(),
							Conclusion:  j.GetConclusion(),
							StartedAt:   j.GetStartedAt().Time,
							CompletedAt: j.GetCompletedAt().Time,
							Steps:       dbSteps,
						})
					}
				}
			} else {
				dbJobs = existingRun.Jobs
			}

			duration := 0.0
			if run.GetUpdatedAt().After(run.GetCreatedAt().Time) {
				duration = run.GetUpdatedAt().Sub(run.GetCreatedAt().Time).Seconds()
			}

			anomalyScore := 0.0
			anomalyReason := ""
			if run.GetConclusion() == "failure" {
				anomalyScore = 0.5
				anomalyReason = "Workflow Failure Detected"
			}
			if duration > 600 { // > 10 minutes
				anomalyScore += 0.4
				if anomalyReason != "" {
					anomalyReason += " & Unusual Duration"
				} else {
					anomalyReason = "Unusual Execution Duration"
				}
			}

			dbRun := WorkflowRun{
				RunID:         run.GetID(),
				RepoID:        repo.ID,
				AccountID:     acc.ID,
				Status:        run.GetStatus(),
				Conclusion:    run.GetConclusion(),
				StartedAt:     run.GetCreatedAt().Time,
				UpdatedAt:     run.GetUpdatedAt().Time,
				Duration:      duration,
				HTMLURL:       run.GetHTMLURL(),
				WorkflowName:  run.GetName(),
				HeadSHA:       run.GetHeadSHA(),
				Jobs:          dbJobs,
				AnomalyScore:  anomalyScore,
				AnomalyReason: anomalyReason,
			}

			filter := bson.M{"runId": run.GetID()}
			update := bson.M{
				"$set":         dbRun,
				"$currentDate": bson.M{"syncedAt": true},
			}
			_, _ = runsColl.UpdateOne(context.TODO(), filter, update, options.Update().SetUpsert(true))

			// Trigger notification if anomaly detected
			if anomalyScore > 0 {
				message := fmt.Sprintf("⚡ GitHub Real-Time Anomaly!\nRepo: %s/%s\nWorkflow: %s\nReason: %s\nURL: %s", 
					owner, repo.Name, run.GetName(), anomalyReason, run.GetHTMLURL())
				notificationClient.TriggerNotificationService(message)
			}

			// --- Issue Tracker Automation (Feature Addition) ---
			// Only trigger for failures and ensure we don't duplicate
			if run.GetConclusion() == "failure" {
				var existingIssue GitHubIssue
				err = issuesColl.FindOne(context.TODO(), bson.M{"runId": run.GetID()}).Decode(&existingIssue)
				if err == mongo.ErrNoDocuments {
					logToAILog(fmt.Sprintf("CRITICAL: Pipeline Failure detected for Run #%d (%s/%s). Initiating Auto-Ticket creation...", run.GetID(), owner, repo.Name))
					createGitHubIssue(context.TODO(), ghClient, issuesColl, owner, repo.Name, dbRun)
				}
			}
		}
		log.Printf("[Sync] Synced %d runs for %s/%s", len(workflowRuns.WorkflowRuns), owner, repo.Name)
	}
}

func createGitHubIssue(ctx context.Context, client *github.Client, coll *mongo.Collection, owner, repo string, run WorkflowRun) {
	title := fmt.Sprintf("❌ Pipeline Failure: %s (#%d)", run.WorkflowName, run.RunID)
	
	// Create a structured diagnostic body for the GitHub Issue
	logSummary := ""
	for _, job := range run.Jobs {
		if job.Conclusion == "failure" {
			logSummary += fmt.Sprintf("### Job: %s\n", job.Name)
			for _, step := range job.Steps {
				if step.Conclusion == "failure" {
					logSummary += fmt.Sprintf("- ❌ Step: **%s** (Number: %d)\n", step.Name, step.Number)
				}
			}
		}
	}

	body := fmt.Sprintf(`## 🛡️ Neural Observability: Automated Diagnostic Report
A mission-critical pipeline failure has been detected. This ticket has been automatically generated with the necessary context for immediate remediation.

**📈 Workflow Diagnostics:**
- **Workflow:** %s
- **Run ID:** [%d](%s)
- **Repo:** %s/%s
- **Commit:** `+"`%s`"+`

**🛠️ Root Cause Clues (Failed Jobs/Steps):**
%s

---
*Generated by VizOps Neural Intelligence Hub*`, run.WorkflowName, run.RunID, run.HTMLURL, owner, repo, run.HeadSHA, logSummary)

	req := &github.IssueRequest{
		Title:  &title,
		Body:   &body,
		Labels: &[]string{"bug", "pipeline-failure", "automated", "neural-rca"},
	}

	ghIssue, _, err := client.Issues.Create(ctx, owner, repo, req)
	if err != nil {
		logToAILog(fmt.Sprintf("ERROR: Failed to create GitHub Issue for Run #%d: %v", run.RunID, err))
		return
	}

	// Capture and store the ticket metadata for dashboard visibility
	dbIssue := GitHubIssue{
		RunID:       run.RunID,
		RepoName:    repo,
		RepoOwner:   owner,
		IssueNumber: ghIssue.GetNumber(),
		IssueURL:    ghIssue.GetHTMLURL(),
		Title:       title,
		Body:        body,
		CreatedAt:   time.Now(),
		Status:      "open",
	}

	_, err = coll.InsertOne(ctx, dbIssue)
	if err != nil {
		logToAILog(fmt.Sprintf("ERROR: Failed to save Ticket Metadata to DB for Run #%d: %v", run.RunID, err))
	} else {
		logToAILog(fmt.Sprintf("SUCCESS: Automated Ticket #%d created for Run #%d", ghIssue.GetNumber(), run.RunID))
	}
}

func logToAILog(msg string) {
	// Persistent logging for debugging the automation layer
	logPath := "/home/mujtaba-rehman/Pipeline-Observability-Hex/app/server/ArgoCD/ArgoCD-Web-App/gemini-ai.log"
	f, err := os.OpenFile(logPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Printf("[Sync-ERROR] Log file unreachable: %v", err)
		return
	}
	defer f.Close()
	fmt.Fprintf(f, "[%s] [NEURAL-TICKET] %s\n", time.Now().Format("2006-01-02 15:04:05"), msg)
}
