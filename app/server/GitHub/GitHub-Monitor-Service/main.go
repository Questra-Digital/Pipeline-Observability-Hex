package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/google/go-github/v60/github"
	"github.com/joho/godotenv"
	"github.com/QuestraDigital/goServices/GitHub-Monitor-Service/notificationClient"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type GitHubAccount struct {
	ID    primitive.ObjectID `bson:"_id"`
	UserID string             `bson:"userId"`
	PAT    string             `bson:"pat"`
	Owner  string             `bson:"owner"`
}

type Repository struct {
	ID        int64              `bson:"repoId"`
	AccountID primitive.ObjectID `bson:"accountId"`
	Name      string             `bson:"name"`
	Owner     string             `bson:"owner"`
	FullName  string             `bson:"fullName"`
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
	Duration      float64            `bson:"duration" json:"duration"` // in seconds
	HTMLURL       string             `bson:"htmlUrl" json:"htmlUrl"`
	WorkflowName  string             `bson:"workflowName" json:"workflowName"`
	Jobs          []Job              `bson:"jobs" json:"jobs"`
	AnomalyScore  float64            `bson:"anomalyScore" json:"anomalyScore"`
	AnomalyReason string             `bson:"anomalyReason" json:"anomalyReason"`
	HeadSHA       string             `bson:"headSha" json:"headSha"`
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

func main() {
	_ = godotenv.Load(".env")
	mongoURL := os.Getenv("MONGO_URL")
	if mongoURL == "" {
		mongoURL = "mongodb://mongouser:mongopassword@localhost:27017/admin"
	}

	client, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(mongoURL))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(context.TODO())

	log.Println("GitHub Monitor Service Started...")

	// Run polling loop every 5 minutes
	ticker := time.NewTicker(5 * time.Minute)
	for {
		pollGitHub(client)
		<-ticker.C
	}
}

func pollGitHub(client *mongo.Client) {
	ctx := context.Background()
	db := client.Database("admin")
	reposColl := db.Collection("github_repos")
	accountsColl := db.Collection("github_accounts")
	runsColl := db.Collection("github_runs")
	issuesColl := db.Collection("github_issues")

	// 1. Get all enabled repositories
	cursor, err := reposColl.Find(context.TODO(), bson.M{"enabled": true})
	if err != nil {
		log.Println("Error fetching repos:", err)
		return
	}
	var repos []Repository
	_ = cursor.All(context.TODO(), &repos)

	for _, repo := range repos {
		// 2. Get the associated account PAT
		var acc GitHubAccount
		err = accountsColl.FindOne(context.TODO(), bson.M{"_id": repo.AccountID}).Decode(&acc)
		if err != nil {
			log.Printf("Error fetching account %s for repo %s: %v", repo.AccountID.Hex(), repo.Name, err)
			continue
		}

		// 3. Fetch latest runs from GitHub
		ghClient := github.NewClient(nil).WithAuthToken(acc.PAT)
		
		repoOwner := repo.Owner
		if repoOwner == "" {
			repoOwner = acc.Owner // Fallback for old data
		}

		workflowRuns, _, err := ghClient.Actions.ListRepositoryWorkflowRuns(context.TODO(), repoOwner, repo.Name, &github.ListWorkflowRunsOptions{
			ListOptions: github.ListOptions{PerPage: 10},
		})
		if err != nil {
			log.Printf("Error fetching runs for %s/%s: %v", repoOwner, repo.Name, err)
			continue
		}

		// 4. Update/Upsert runs in MongoDB
		for _, run := range workflowRuns.WorkflowRuns {
			// Fetch jobs for this run
			jobs, _, err := ghClient.Actions.ListWorkflowJobs(context.TODO(), repoOwner, repo.Name, run.GetID(), nil)
			var dbJobs []Job
			if err == nil {
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

			duration := 0.0
			if run.GetUpdatedAt().After(run.GetCreatedAt().Time) {
				duration = run.GetUpdatedAt().Sub(run.GetCreatedAt().Time).Seconds()
			}

			// --- Basic Anomaly Detection ---
			anomalyScore := 0.0
			anomalyReason := ""

			// Detect consecutive failures (simplified: check if latest run failed)
			if run.GetConclusion() == "failure" {
				anomalyScore = 0.5
				anomalyReason = "Workflow Failure Detected"
			}

			// Detect duration spikes (simplified: > 10 mins)
			if duration > 600 {
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
				Jobs:          dbJobs,
				AnomalyScore:  anomalyScore,
				AnomalyReason: anomalyReason,
				HeadSHA:       run.GetHeadSHA(),
			}

			filter := bson.M{"runId": run.GetID()}
			update := bson.M{"$set": dbRun}
			_, err = runsColl.UpdateOne(context.TODO(), filter, update, options.Update().SetUpsert(true))
			if err != nil {
				log.Printf("Error updating run %d: %v", run.GetID(), err)
			}

			// Trigger notification if anomaly detected
			if anomalyScore > 0 {
				message := fmt.Sprintf("🚀 GitHub Anomaly Detected!\nRepo: %s/%s\nWorkflow: %s\nReason: %s\nURL: %s", 
					repoOwner, repo.Name, run.GetName(), anomalyReason, run.GetHTMLURL())
				notificationClient.TriggerNotificationService(message)
			}

			// --- Issue Tracker Automation (Feature) ---
			if run.GetConclusion() == "failure" {
				// 1. Check if an issue already exists for this RunID
				var existingIssue GitHubIssue
				err = issuesColl.FindOne(context.TODO(), bson.M{"runId": run.GetID()}).Decode(&existingIssue)
				if err == mongo.ErrNoDocuments {
					// 2. Create fresh issue
					logToAILog(fmt.Sprintf("Pipeline Failure: Auto-creating GitHub Issue for Run #%d", run.GetID()))
					createGitHubIssue(ctx, ghClient, issuesColl, repoOwner, repo.Name, dbRun)
				}
			}
		}
		log.Printf("Synced %d runs for %s/%s", len(workflowRuns.WorkflowRuns), repoOwner, repo.Name)
	}
}

func createGitHubIssue(ctx context.Context, client *github.Client, coll *mongo.Collection, owner, repo string, run WorkflowRun) {
	title := fmt.Sprintf("❌ Pipeline Failure: %s (#%d)", run.WorkflowName, run.RunID)
	
	// Synthesize a brief log summary for the issue body
	logSummary := ""
	for _, job := range run.Jobs {
		if job.Conclusion == "failure" {
			logSummary += fmt.Sprintf("### Job: %s\n", job.Name)
			for _, step := range job.Steps {
				if step.Conclusion == "failure" {
					logSummary += fmt.Sprintf("- ❌ Step: %s (Status: %s)\n", step.Name, step.Conclusion)
				}
			}
		}
	}

	body := fmt.Sprintf(`## 🛡️ Automated RCA Report
A failed workflow run was detected. This issue has been automatically created to track the fix.

**📈 Workflow Info:**
- **Name:** %s
- **Run ID:** [%d](%s)
- **Repo:** %s/%s
- **Commit:** `+"`%s`"+`

**🛠️ Failure Summary:**
%s

---
*Created by Pipeline Observability Assistant*`, run.WorkflowName, run.RunID, run.HTMLURL, owner, repo, run.HeadSHA, logSummary)

	req := &github.IssueRequest{
		Title:  &title,
		Body:   &body,
		Labels: &[]string{"bug", "pipeline-failure", "automated"},
	}

	ghIssue, _, err := client.Issues.Create(ctx, owner, repo, req)
	if err != nil {
		logToAILog(fmt.Sprintf("ERROR creating GitHub Issue for Run #%d: %v", run.RunID, err))
		return
	}

	// Save information back to MongoDB for tracking/deduplication
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
		logToAILog(fmt.Sprintf("ERROR saving Ticket Info to MongoDB for Run #%d: %v", run.RunID, err))
	} else {
		logToAILog(fmt.Sprintf("SUCCESS: Ticket #%d created on GitHub for Run #%d", ghIssue.GetNumber(), run.RunID))
	}
}

func logToAILog(msg string) {
	f, err := os.OpenFile("/home/mujtaba-rehman/Pipeline-Observability-Hex/app/server/ArgoCD/ArgoCD-Web-App/gemini-ai.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Printf("FAIL: %v", err)
		return
	}
	defer f.Close()
	fmt.Fprintf(f, "[%s] [AUTO-TICKET] %s\n", time.Now().Format("2006-01-02 15:04:05"), msg)
}
