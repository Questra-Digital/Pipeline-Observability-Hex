package github

import (
	"context"
	"net/http"

	"github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller"
	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"github.com/google/go-github/v60/github"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// RunActionRequest is the shared body for cancel / retry endpoints.
type RunActionRequest struct {
	AccountID string `json:"accountId" binding:"required"`
	Owner     string `json:"owner"     binding:"required"`
	Repo      string `json:"repo"      binding:"required"`
	RunID     int64  `json:"runId"     binding:"required"`
}

// resolveAccountClient is a shared helper: looks up the account, verifies
// user ownership, and returns an authenticated GitHub client.
func resolveAccountClient(c *gin.Context, req RunActionRequest) (*github.Client, error) {
	accountID, err := primitive.ObjectIDFromHex(req.AccountID)
	if err != nil {
		return nil, err
	}

	userEmail := controller.GetUserEmail(c)
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		return nil, err
	}
	defer mongoClient.Disconnect(context.TODO())

	var account GitHubAccount
	if err := mongoClient.Database("admin").Collection("github_accounts").
		FindOne(context.TODO(), bson.M{"_id": accountID, "userId": userEmail}).
		Decode(&account); err != nil {
		return nil, err
	}
	return github.NewClient(nil).WithAuthToken(account.PAT), nil
}

// CancelRun cancels an in-progress or queued workflow run.
// POST /api/github/cancel
// Body: { accountId, owner, repo, runId }
func CancelRun(c *gin.Context) {
	userEmail := controller.GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req RunActionRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	accountID, err := primitive.ObjectIDFromHex(req.AccountID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid accountId"})
		return
	}

	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	var account GitHubAccount
	if err := mongoClient.Database("admin").Collection("github_accounts").
		FindOne(context.TODO(), bson.M{"_id": accountID, "userId": userEmail}).
		Decode(&account); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Account not found or access denied"})
		return
	}

	ghClient := github.NewClient(nil).WithAuthToken(account.PAT)
	_, err = ghClient.Actions.CancelWorkflowRunByID(context.TODO(), req.Owner, req.Repo, req.RunID)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to cancel run: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Run cancellation requested",
		"runId":   req.RunID,
		"repo":    req.Owner + "/" + req.Repo,
	})
}

// RetryRun re-runs all jobs of a failed/cancelled workflow run.
// POST /api/github/retry
// Body: { accountId, owner, repo, runId }
func RetryRun(c *gin.Context) {
	userEmail := controller.GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req RunActionRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	accountID, err := primitive.ObjectIDFromHex(req.AccountID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid accountId"})
		return
	}

	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	var account GitHubAccount
	if err := mongoClient.Database("admin").Collection("github_accounts").
		FindOne(context.TODO(), bson.M{"_id": accountID, "userId": userEmail}).
		Decode(&account); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Account not found or access denied"})
		return
	}

	ghClient := github.NewClient(nil).WithAuthToken(account.PAT)
	_, err = ghClient.Actions.RerunWorkflowByID(context.TODO(), req.Owner, req.Repo, req.RunID)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to retry run: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Run re-queued successfully",
		"runId":   req.RunID,
		"repo":    req.Owner + "/" + req.Repo,
	})
}

// RetryFailedJobs re-runs only the failed jobs of a workflow run, saving CI time.
// POST /api/github/retry-failed
// Body: { accountId, owner, repo, runId }
func RetryFailedJobs(c *gin.Context) {
	userEmail := controller.GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req RunActionRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	accountID, err := primitive.ObjectIDFromHex(req.AccountID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid accountId"})
		return
	}

	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	var account GitHubAccount
	if err := mongoClient.Database("admin").Collection("github_accounts").
		FindOne(context.TODO(), bson.M{"_id": accountID, "userId": userEmail}).
		Decode(&account); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Account not found or access denied"})
		return
	}

	ghClient := github.NewClient(nil).WithAuthToken(account.PAT)
	_, err = ghClient.Actions.RerunFailedJobsByID(context.TODO(), req.Owner, req.Repo, req.RunID)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to retry failed jobs: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Failed jobs re-queued successfully",
		"runId":   req.RunID,
		"repo":    req.Owner + "/" + req.Repo,
	})
}
