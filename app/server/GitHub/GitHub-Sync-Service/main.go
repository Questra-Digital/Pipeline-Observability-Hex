package main

import (
	"context"
	"log"
	"os"
	"sync"
	"time"

	"github.com/google/go-github/v60/github"
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

const defaultSyncInterval = 60 // 60 seconds is safer for rate limits

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
		}
		log.Printf("[Sync] Synced %d runs for %s/%s", len(workflowRuns.WorkflowRuns), owner, repo.Name)
	}
}
