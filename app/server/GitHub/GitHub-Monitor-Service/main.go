//go:build ignore
// +build ignore

// This service is DISABLED — it was the original GitHub monitor polling every 5 minutes.
// GitHub-Sync-Service replaces it with per-account interval-based polling, rate-limit
// optimizations, and anomaly detection. See docker-compose.yml line 75 where it's commented
// out with the note: "github-monitor is DISABLED -- redundant with github-sync".
//
// If re-enabling, fix the following before deployment:
//   - Replace hardcoded developer log path "/home/mujtaba-rehman/..." with env var
//   - Replace "mongodb://mongouser:mongopassword@localhost:27017/admin" with env var
//   - Replace notificationClient log.Fatalf with error returns
//   - Replace grpc.WithInsecure() with env-based TLS config
//   - Replace context.TODO() with proper timeouts
//   - Add graceful shutdown (SIGINT/SIGTERM handler)
//   - Fix silent error swallows in cursor.All(), ListWorkflowJobs(), etc.

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
	Duration      float64            `bson:"duration" json:"duration"`
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
	Status      string             `bson:"status" json:"status"`
}

func main() {
	_ = godotenv.Load(".env")
	mongoURL := os.Getenv("MONGO_URL")
	if mongoURL == "" {
		mongoURL = "mongodb://localhost:27017/admin"
	}

	client, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(mongoURL))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(context.TODO())

	log.Println("GitHub Monitor Service Started...")

	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		log.Println("Polling GitHub accounts...")
		_ = client
	}
}
