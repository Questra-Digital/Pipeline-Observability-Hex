package main

import (
	"context"
	"log"
	"os"
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
	Jobs          []Job              `bson:"jobs" json:"jobs"`
	AnomalyScore  float64            `bson:"anomalyScore" json:"anomalyScore"`
	AnomalyReason string             `bson:"anomalyReason" json:"anomalyReason"`
}

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

	// Create TTL Index for 14-day retention
	ensureTTLIndex(client)

	log.Println("⚡ GitHub Real-Time Sync Service Started...")

	// Global loop: Check for accounts and repositories
	// In a real production scenario, we might use a pool of workers per user.
	// For this implementation, we poll all enabled repos every 3 seconds (default).
	for {
		pollGitHub(client)
		time.Sleep(3 * time.Second)
	}
}

func ensureTTLIndex(client *mongo.Client) {
	coll := client.Database("admin").Collection("github_runs")
	// Index expires after 14 days (1209600 seconds)
	indexModel := mongo.IndexModel{
		Keys:    bson.M{"updatedAt": 1},
		Options: options.Index().SetExpireAfterSeconds(1209600),
	}
	_, err := coll.Indexes().CreateOne(context.TODO(), indexModel)
	if err != nil {
		log.Printf("Warning: Could not create TTL index: %v", err)
	}
}

func pollGitHub(client *mongo.Client) {
	db := client.Database("admin")
	reposColl := db.Collection("github_repos")
	accountsColl := db.Collection("github_accounts")
	runsColl := db.Collection("github_runs")

	cursor, err := reposColl.Find(context.TODO(), bson.M{"enabled": true})
	if err != nil {
		return
	}
	var repos []Repository
	_ = cursor.All(context.TODO(), &repos)

	for _, repo := range repos {
		var acc GitHubAccount
		err = accountsColl.FindOne(context.TODO(), bson.M{"_id": repo.AccountID}).Decode(&acc)
		if err != nil {
			continue
		}

		// Use dynamic interval if set, else default to 3s (handled by sleep in main)
		// Note: Truly dynamic intervals would need a go-routine per account.
		// For now, we follow the 3s requirement globally as a high-speed sync.

		ghClient := github.NewClient(nil).WithAuthToken(acc.PAT)
		workflowRuns, _, err := ghClient.Actions.ListRepositoryWorkflowRuns(context.TODO(), repo.Owner, repo.Name, &github.ListWorkflowRunsOptions{
			ListOptions: github.ListOptions{PerPage: 5},
		})
		if err != nil {
			continue
		}

		for _, run := range workflowRuns.WorkflowRuns {
			jobs, _, _ := ghClient.Actions.ListWorkflowJobs(context.TODO(), repo.Owner, repo.Name, run.GetID(), nil)
			var dbJobs []Job
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

			duration := 0.0
			if run.GetUpdatedAt().After(run.GetCreatedAt().Time) {
				duration = run.GetUpdatedAt().Sub(run.GetCreatedAt().Time).Seconds()
			}

			dbRun := WorkflowRun{
				RunID:        run.GetID(),
				RepoID:       repo.ID,
				AccountID:    acc.ID,
				Status:       run.GetStatus(),
				Conclusion:   run.GetConclusion(),
				StartedAt:    run.GetCreatedAt().Time,
				UpdatedAt:    run.GetUpdatedAt().Time,
				Duration:     duration,
				HTMLURL:      run.GetHTMLURL(),
				WorkflowName: run.GetName(),
				Jobs:         dbJobs,
			}

			filter := bson.M{"runId": run.GetID()}
			update := bson.M{"$set": dbRun}
			_, _ = runsColl.UpdateOne(context.TODO(), filter, update, options.Update().SetUpsert(true))
		}
	}
}
