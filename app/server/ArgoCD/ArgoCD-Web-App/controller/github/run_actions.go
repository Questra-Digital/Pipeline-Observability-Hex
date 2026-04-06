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
	"go.mongodb.org/mongo-driver/mongo/options"
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

// WorkflowSummary represents the latest run for a unique workflow.
type WorkflowSummary struct {
	WorkflowName string `json:"workflowName"`
	RunID        int64  `json:"runId"`
	RepoID       int64  `json:"repoId"`
	RepoName     string `json:"repoName"`
	RepoOwner    string `json:"repoOwner"`
	Status       string `json:"status"`
	Conclusion   string `json:"conclusion"`
	HTMLURL      string `json:"htmlUrl"`
	UpdatedAt    string `json:"updatedAt"`
}

// runForSummary is a lean struct for reading from github_runs.
type runForSummary struct {
	RunID        int64              `bson:"runId"`
	RepoID       int64              `bson:"repoId"`
	AccountID    primitive.ObjectID `bson:"accountId"`
	Status       string             `bson:"status"`
	Conclusion   string             `bson:"conclusion"`
	UpdatedAt    primitive.DateTime `bson:"updatedAt"`
	HTMLURL      string             `bson:"htmlUrl"`
	WorkflowName string             `bson:"workflowName"`
}

// GetWorkflowSummary returns the latest run per unique workflow across all repos.
// Powers the Re-Run panel in the Dispatch tab — requires zero YAML changes.
// GET /api/github/workflow-summary?accountId=&repo=
func GetWorkflowSummary(c *gin.Context) {
	userEmail := controller.GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	accountIDStr := c.Query("accountId")
	repoFilter := c.Query("repo")

	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	db := mongoClient.Database("admin")

	// Build filter scoped to this user's accounts
	accountsColl := db.Collection("github_accounts")
	var accounts []GitHubAccount
	cur, _ := accountsColl.Find(context.TODO(), bson.M{"userId": userEmail})
	_ = cur.All(context.TODO(), &accounts)

	accountIDs := make([]primitive.ObjectID, 0, len(accounts))
	for _, a := range accounts {
		if accountIDStr == "" || a.ID.Hex() == accountIDStr {
			accountIDs = append(accountIDs, a.ID)
		}
	}
	if len(accountIDs) == 0 {
		c.JSON(http.StatusOK, []WorkflowSummary{})
		return
	}

	// Build a repoId→{name,owner} lookup from github_repos
	type repoInfo struct{ Name, Owner string }
	repoLookup := make(map[int64]repoInfo)
	reposColl := db.Collection("github_repos")
	repoFilter2 := bson.M{"accountId": bson.M{"$in": accountIDs}}
	if repoFilter != "" {
		repoFilter2["name"] = repoFilter
	}
	repoCur, _ := reposColl.Find(context.TODO(), repoFilter2)
	var repos []Repository
	_ = repoCur.All(context.TODO(), &repos)
	repoIDs := make([]int64, 0, len(repos))
	for _, r := range repos {
		repoLookup[r.ID] = repoInfo{Name: r.Name, Owner: r.Owner}
		repoIDs = append(repoIDs, r.ID)
	}

	// Fetch latest runs for these repos
	filter := bson.M{
		"accountId": bson.M{"$in": accountIDs},
	}
	if len(repoIDs) > 0 {
		filter["repoId"] = bson.M{"$in": repoIDs}
	}

	opts := options.Find().
		SetSort(bson.D{{Key: "updatedAt", Value: -1}}).
		SetLimit(500)
	runsColl := db.Collection("github_runs")
	cursor, err := runsColl.Find(context.TODO(), filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch runs"})
		return
	}
	var runs []runForSummary
	_ = cursor.All(context.TODO(), &runs)

	// Deduplicate: keep only the latest run per workflow name
	seen := make(map[string]bool)
	result := make([]WorkflowSummary, 0)
	for _, r := range runs {
		key := r.WorkflowName + "|" + string(rune(r.RepoID))
		if seen[key] {
			continue
		}
		seen[key] = true
		repo := repoLookup[r.RepoID]
		result = append(result, WorkflowSummary{
			WorkflowName: r.WorkflowName,
			RunID:        r.RunID,
			RepoID:       r.RepoID,
			RepoName:     repo.Name,
			RepoOwner:    repo.Owner,
			Status:       r.Status,
			Conclusion:   r.Conclusion,
			HTMLURL:      r.HTMLURL,
			UpdatedAt:    r.UpdatedAt.Time().Format("2006-01-02T15:04:05Z"),
		})
	}

	c.JSON(http.StatusOK, result)
}
