package github

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"

	"github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller"
	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"github.com/google/go-github/v60/github"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type WorkflowRun struct {
	RunID         int64              `bson:"runId" json:"runId"`
	RepoID        int64              `bson:"repoId" json:"repoId"`
	AccountID     primitive.ObjectID `bson:"accountId" json:"accountId"`
	Status        string             `bson:"status" json:"status"`
	Conclusion    string             `bson:"conclusion" json:"conclusion"`
	StartedAt     primitive.DateTime `bson:"startedAt" json:"startedAt"`
	UpdatedAt     primitive.DateTime `bson:"updatedAt" json:"updatedAt"`
	Duration      float64            `bson:"duration" json:"duration"`
	HTMLURL       string             `bson:"htmlUrl" json:"htmlUrl"`
	WorkflowName  string             `bson:"workflowName" json:"workflowName"`
	Jobs          []Job              `bson:"jobs" json:"jobs"`
	AnomalyScore  float64            `bson:"anomalyScore" json:"anomalyScore"`
	AnomalyReason string             `bson:"anomalyReason" json:"anomalyReason"`
}

type Job struct {
	ID          int64              `bson:"id" json:"id"`
	Name        string             `bson:"name" json:"name"`
	Status      string             `bson:"status" json:"status"`
	Conclusion  string             `bson:"conclusion" json:"conclusion"`
	StartedAt   primitive.DateTime `bson:"startedAt" json:"startedAt"`
	CompletedAt primitive.DateTime `bson:"completedAt" json:"completedAt"`
	Steps       []Step             `bson:"steps" json:"steps"`
}

type Step struct {
	Name        string             `bson:"name" json:"name"`
	Status      string             `bson:"status" json:"status"`
	Conclusion  string             `bson:"conclusion" json:"conclusion"`
	Number      int64              `bson:"number" json:"number"`
	StartedAt   primitive.DateTime `bson:"startedAt" json:"startedAt"`
	CompletedAt primitive.DateTime `bson:"completedAt" json:"completedAt"`
}

type Repository struct {
	ID          int64              `bson:"repoId" json:"repoId"` // Change json to repoId for consistency
	AccountID   primitive.ObjectID `bson:"accountId" json:"accountId"`
	Name        string             `bson:"name" json:"name"`
	Owner       string             `bson:"owner" json:"owner"`
	FullName    string             `bson:"fullName" json:"fullName"`
	Enabled     bool               `bson:"enabled" json:"enabled"`
	Description string             `bson:"description" json:"description"`
}

type AccountReposResponse struct {
	ID           primitive.ObjectID `json:"id"`
	Name         string             `json:"name"`
	Owner        string             `json:"owner"`
	SyncInterval int                `json:"syncInterval"`
	Repositories []Repository       `json:"repositories"`
}

func GetGitHubRepos(c *gin.Context) {
	userEmail := controller.GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	accountsColl := mongoClient.Database("admin").Collection("github_accounts")
	reposColl := mongoClient.Database("admin").Collection("github_repos")

	// Ensure unique index on (repoId, accountId) to prevent duplicates at DB level
	_, _ = reposColl.Indexes().CreateOne(context.TODO(), mongo.IndexModel{
		Keys:    bson.D{{Key: "repoId", Value: 1}, {Key: "accountId", Value: 1}},
		Options: options.Index().SetUnique(true),
	})

	// Find all accounts for the user
	var accounts []GitHubAccount
	cursor, err := accountsColl.Find(context.TODO(), bson.M{"userId": userEmail})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch accounts"})
		return
	}
	if err = cursor.All(context.TODO(), &accounts); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error decoding accounts"})
		return
	}

	response := []AccountReposResponse{}

	for _, acc := range accounts {
		// Try to find cached repos in DB first
		var repos []Repository
		repoCursor, err := reposColl.Find(context.TODO(), bson.M{"accountId": acc.ID})
		if err == nil {
			_ = repoCursor.All(context.TODO(), &repos)
		}

		// If no repos found in DB, sync from GitHub (initial sync)
		if len(repos) == 0 {
			freshRepos := syncReposFromGitHub(acc)
			if len(freshRepos) > 0 {
				// Use upsert to prevent duplicates
				for _, r := range freshRepos {
					filter := bson.M{"repoId": r.ID, "accountId": r.AccountID}
					update := bson.M{"$setOnInsert": r}
					opts := options.Update().SetUpsert(true)
					_, _ = reposColl.UpdateOne(context.TODO(), filter, update, opts)
				}
				// Re-read from DB to get the actual state (with _id fields)
				repoCursor, err = reposColl.Find(context.TODO(), bson.M{"accountId": acc.ID})
				if err == nil {
					repos = nil
					_ = repoCursor.All(context.TODO(), &repos)
				}
			}
		}

		response = append(response, AccountReposResponse{
			ID:           acc.ID,
			Name:         acc.Label,
			Owner:        acc.Owner,
			SyncInterval: acc.SyncInterval,
			Repositories: repos,
		})
	}

	c.JSON(http.StatusOK, response)
}

func syncReposFromGitHub(acc GitHubAccount) []Repository {
	ctx := context.Background()
	client := github.NewClient(nil).WithAuthToken(acc.PAT)

	opt := &github.RepositoryListOptions{
		ListOptions: github.ListOptions{PerPage: 100},
	}

	var allRepos []Repository
	for {
		repos, resp, err := client.Repositories.List(ctx, "", opt)
		if err != nil {
			log.Printf("[SyncRepos] Failed to list repositories: %v\n", err)
			break
		}
		for _, r := range repos {
			repoOwner := r.GetOwner().GetLogin()
			repoName := r.GetName()

			// Check if repository has workflows
			workflows, wResp, err := client.Actions.ListWorkflows(ctx, repoOwner, repoName, &github.ListOptions{PerPage: 1})
			
			hasWorkflows := false
			if err == nil && workflows.GetTotalCount() > 0 {
				hasWorkflows = true
			} else if err != nil {
				// RESILIENCE: If we hit a rate limit (403) or error during the workflow check, 
				// DO NOT skip the repo. It's safer to include it and let the sync service 
				// deal with it later than to hide it from the user entirely.
				if wResp != nil && wResp.StatusCode == 403 {
					log.Printf("[SyncRepos] Rate limit during workflow check for %s/%s. Keeping repo as fallback.\n", repoOwner, repoName)
					hasWorkflows = true // Assume it might have them
				} else {
					log.Printf("[SyncRepos] Error checking workflows for %s/%s: %v\n", repoOwner, repoName, err)
				}
			}

			if hasWorkflows {
				allRepos = append(allRepos, Repository{
					ID:          r.GetID(),
					AccountID:   acc.ID,
					Name:        repoName,
					Owner:       repoOwner,
					FullName:    r.GetFullName(),
					Enabled:     false, // Disabled by default
					Description: r.GetDescription(),
				})
			}
		}
		if resp.NextPage == 0 {
			break
		}
		opt.Page = resp.NextPage
	}
	log.Printf("[SyncRepos] Discovered %d potential repositories for %s\n", len(allRepos), acc.Owner)
	return allRepos
}

func ToggleRepoMonitoring(c *gin.Context) {
	var req struct {
		AccountID string `json:"accountId" binding:"required"`
		RepoID    int64  `json:"repoId" binding:"required"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	accID, err := primitive.ObjectIDFromHex(req.AccountID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account ID"})
		return
	}

	userEmail := controller.GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	// Verify account ownership
	accountsColl := mongoClient.Database("admin").Collection("github_accounts")
	var acc GitHubAccount
	err = accountsColl.FindOne(context.TODO(), bson.M{"_id": accID, "userId": userEmail}).Decode(&acc)
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Account not found or access denied"})
		return
	}

	// Toggle enabled status
	reposColl := mongoClient.Database("admin").Collection("github_repos")
	
	// Atomic update: find the repo and toggle its 'enabled' field
	var repo Repository
	err = reposColl.FindOne(context.TODO(), bson.M{"accountId": accID, "repoId": req.RepoID}).Decode(&repo)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Repository not found"})
		return
	}

	newStatus := !repo.Enabled
	log.Printf("[ToggleRepo] Updating repo %d for account %s to enabled=%v\n", req.RepoID, req.AccountID, newStatus)
	
	_, err = reposColl.UpdateOne(context.TODO(), 
		bson.M{"accountId": accID, "repoId": req.RepoID},
		bson.M{"$set": bson.M{"enabled": newStatus}},
	)
	if err != nil {
		log.Printf("[ToggleRepo] Failed to update: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update repository status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Repository status updated", "enabled": newStatus})
}

func GetGitHubSettings(c *gin.Context) {
	userEmail := controller.GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	collection := mongoClient.Database("admin").Collection("github_settings")
	
	var settings bson.M
	err = collection.FindOne(context.TODO(), bson.M{"userId": userEmail}).Decode(&settings)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// Return default settings
			c.JSON(http.StatusOK, gin.H{"status": "inactive", "limit": 10})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch settings"})
		return
	}

	c.JSON(http.StatusOK, settings)
}

func UpdateGitHubStatus(c *gin.Context) {
	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	userEmail := controller.GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	collection := mongoClient.Database("admin").Collection("github_settings")
	_, err = collection.UpdateOne(context.TODO(), 
		bson.M{"userId": userEmail},
		bson.M{"$set": bson.M{"status": req.Status}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status updated successfully"})
}

func UpdateGitHubLimit(c *gin.Context) {
	var req struct {
		Limit int `json:"limit" binding:"required"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	userEmail := controller.GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	collection := mongoClient.Database("admin").Collection("github_settings")
	_, err = collection.UpdateOne(context.TODO(), 
		bson.M{"userId": userEmail},
		bson.M{"$set": bson.M{"limit": req.Limit}},
		options.Update().SetUpsert(true),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update limit"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Limit updated successfully"})
}

func GetGitHubRuns(c *gin.Context) {
	userEmail := controller.GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	runsColl := mongoClient.Database("admin").Collection("github_runs")

	// Filter by account or repo if provided
	filter := bson.M{}
	if repoIDStr := c.Query("repoId"); repoIDStr != "" {
		repoID, err := strconv.ParseInt(repoIDStr, 10, 64)
		if err == nil {
			filter["repoId"] = repoID
		}
	}

	// We need to make sure the runs belong to the user's accounts
	accountsColl := mongoClient.Database("admin").Collection("github_accounts")
	var accounts []GitHubAccount
	cursor, err := accountsColl.Find(context.TODO(), bson.M{"userId": userEmail})
	if err == nil {
		_ = cursor.All(context.TODO(), &accounts)
	}
	
	accountIDs := []primitive.ObjectID{}
	for _, acc := range accounts {
		accountIDs = append(accountIDs, acc.ID)
	}
	filter["accountId"] = bson.M{"$in": accountIDs}

	log.Printf("[GetGitHubRuns] Fetching runs with filter: %+v\n", filter)

	var runs []WorkflowRun
	opts := options.Find().SetSort(bson.D{{Key: "startedAt", Value: -1}}).SetLimit(50)
	cursor, err = runsColl.Find(context.TODO(), filter, opts)
	if err != nil {
		log.Printf("[GetGitHubRuns] Find error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch runs"})
		return
	}
	_ = cursor.All(context.TODO(), &runs)

	log.Printf("[GetGitHubRuns] Found %d runs\n", len(runs))

	if runs == nil {
		runs = []WorkflowRun{}
	}

	c.JSON(http.StatusOK, runs)
}

func GetGitHubAnalytics(c *gin.Context) {
	userEmail := controller.GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	runsColl := mongoClient.Database("admin").Collection("github_runs")
	accountsColl := mongoClient.Database("admin").Collection("github_accounts")

	var accounts []GitHubAccount
	cursor, err := accountsColl.Find(context.TODO(), bson.M{"userId": userEmail})
	if err == nil {
		_ = cursor.All(context.TODO(), &accounts)
	}
	accountIDs := []primitive.ObjectID{}
	for _, acc := range accounts {
		accountIDs = append(accountIDs, acc.ID)
	}

	repoIDStr := c.Query("repoId")
	matchStage := bson.M{"accountId": bson.M{"$in": accountIDs}}
	if repoIDStr != "" {
		repoID, _ := strconv.ParseInt(repoIDStr, 10, 64)
		matchStage = bson.M{"repoId": repoID}
	}

	// 1. Success Rate aggregation
	pipeline := mongo.Pipeline{
		{{Key: "$match", Value: matchStage}},
		{{Key: "$group", Value: bson.M{
			"_id":   "$conclusion",
			"count": bson.M{"$sum": 1},
		}}},
	}
	cursor, _ = runsColl.Aggregate(context.TODO(), pipeline)
	var conclusions []bson.M
	_ = cursor.All(context.TODO(), &conclusions)

	// 2. Bottlenecks (Slowest Workflows/Jobs)
	bottleneckPipeline := mongo.Pipeline{
		{{Key: "$match", Value: matchStage}},
		{{Key: "$group", Value: bson.M{
			"_id":         "$workflowName",
			"avgDuration": bson.M{"$avg": "$duration"},
			"maxDuration": bson.M{"$max": "$duration"},
		}}},
		{{Key: "$sort", Value: bson.D{{Key: "avgDuration", Value: -1}}}},
		{{Key: "$limit", Value: 5}},
	}
	cursor, _ = runsColl.Aggregate(context.TODO(), bottleneckPipeline)
	var bottlenecks []bson.M
	_ = cursor.All(context.TODO(), &bottlenecks)

	// 3. Failure Breakdown
	failureMatch := matchStage
	if repoIDStr == "" {
		failureMatch = bson.M{"accountId": bson.M{"$in": accountIDs}, "conclusion": "failure"}
	} else {
		repoID, _ := strconv.ParseInt(repoIDStr, 10, 64)
		failureMatch = bson.M{"repoId": repoID, "conclusion": "failure"}
	}

	failurePipeline := mongo.Pipeline{
		{{Key: "$match", Value: failureMatch}},
		{{Key: "$group", Value: bson.M{
			"_id":          "$workflowName",
			"failureCount": bson.M{"$sum": 1},
		}}},
		{{Key: "$sort", Value: bson.D{{Key: "failureCount", Value: -1}}}},
	}
	cursor, _ = runsColl.Aggregate(context.TODO(), failurePipeline)
	var failures []bson.M
	_ = cursor.All(context.TODO(), &failures)

	// 4. Time Series Trend (with failures count per day)
	durationPipeline := mongo.Pipeline{
		{{Key: "$match", Value: matchStage}},
		{{Key: "$group", Value: bson.M{
			"_id":         bson.M{"$dateToString": bson.M{"format": "%Y-%m-%d", "date": "$startedAt"}},
			"avgDuration": bson.M{"$avg": "$duration"},
			"totalRuns":   bson.M{"$sum": 1},
			"failures": bson.M{"$sum": bson.M{
				"$cond": bson.A{bson.M{"$eq": bson.A{"$conclusion", "failure"}}, 1, 0},
			}},
		}}},
		{{Key: "$sort", Value: bson.D{{Key: "_id", Value: 1}}}},
	}
	cursor, _ = runsColl.Aggregate(context.TODO(), durationPipeline)
	var trends []bson.M
	_ = cursor.All(context.TODO(), &trends)


	c.JSON(http.StatusOK, gin.H{
		"conclusions": conclusions,
		"bottlenecks": bottlenecks,
		"failures":    failures,
		"trends":      trends,
	})
}

func GetGitHubAlerts(c *gin.Context) {
	userEmail := controller.GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	runsColl := mongoClient.Database("admin").Collection("github_runs")
	accountsColl := mongoClient.Database("admin").Collection("github_accounts")

	var accounts []GitHubAccount
	cursor, _ := accountsColl.Find(context.TODO(), bson.M{"userId": userEmail})
	_ = cursor.All(context.TODO(), &accounts)

	accountIDs := []primitive.ObjectID{}
	for _, acc := range accounts {
		accountIDs = append(accountIDs, acc.ID)
	}

	repoIDStr := c.Query("repoId")
	filter := bson.M{
		"accountId":    bson.M{"$in": accountIDs},
		"anomalyScore": bson.M{"$gt": 0},
	}
	if repoIDStr != "" {
		repoID, _ := strconv.ParseInt(repoIDStr, 10, 64)
		filter["repoId"] = repoID
	}

	opts := options.Find().SetSort(bson.D{{Key: "startedAt", Value: -1}}).SetLimit(10)
	cursor, _ = runsColl.Find(context.TODO(), filter, opts)
	var anomalies []WorkflowRun
	_ = cursor.All(context.TODO(), &anomalies)

	c.JSON(http.StatusOK, anomalies)
}

func GetGitHubJobLogs(c *gin.Context) {
	userEmail := controller.GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	repoOwner := c.Query("owner")
	repoName := c.Query("repo")
	jobIDStr := c.Query("jobId")
	jobID, _ := strconv.ParseInt(jobIDStr, 10, 64)

	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	accountsColl := mongoClient.Database("admin").Collection("github_accounts")
	var acc GitHubAccount
	err = accountsColl.FindOne(context.TODO(), bson.M{"userId": userEmail, "owner": repoOwner}).Decode(&acc)
	if err != nil {
		err = accountsColl.FindOne(context.TODO(), bson.M{"userId": userEmail}).Decode(&acc)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "GitHub account not found"})
			return
		}
	}

	ghClient := github.NewClient(nil).WithAuthToken(acc.PAT)
	url, resp, err := ghClient.Actions.GetWorkflowJobLogs(context.TODO(), repoOwner, repoName, jobID, 10)
	if err != nil {
		if resp != nil && resp.StatusCode == 404 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Logs not found on GitHub. They may have expired (90-day retention) or the run was deleted."})
			return
		}
		fmt.Printf("Error fetching GitHub log URL: %v (Owner: %s, Repo: %s, Job: %d)\n", err, repoOwner, repoName, jobID)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching log URL from GitHub"})
		return
	}

	// Fetch the actual log content
	logResp, err := http.Get(url.String())
	if err != nil {
		fmt.Printf("Error downloading logs from S3/Redirect: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error downloading logs"})
		return
	}
	defer logResp.Body.Close()

	logBytes, err := io.ReadAll(logResp.Body)
	if err != nil {
		fmt.Printf("Error reading log body: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error reading logs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"url":  url.String(),
		"logs": string(logBytes),
	})
}
// GetGitHubInsights computes advanced intelligence metrics:
// - MTTR per workflow (time from failure to next success)
// - Build cost estimate (build minutes × GitHub Actions pricing)
// - Day-of-week failure heatmap
// - Build time regression (last 7 days vs prior 7 days)
func GetGitHubInsights(c *gin.Context) {
	userEmail := controller.GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	runsColl := mongoClient.Database("admin").Collection("github_runs")
	accountsColl := mongoClient.Database("admin").Collection("github_accounts")

	var accounts []GitHubAccount
	cursor, _ := accountsColl.Find(context.TODO(), bson.M{"userId": userEmail})
	_ = cursor.All(context.TODO(), &accounts)

	accountIDs := []primitive.ObjectID{}
	for _, acc := range accounts {
		accountIDs = append(accountIDs, acc.ID)
	}

	repoIDStr := c.Query("repoId")
	matchStage := bson.M{"accountId": bson.M{"$in": accountIDs}}
	if repoIDStr != "" {
		repoID, _ := strconv.ParseInt(repoIDStr, 10, 64)
		matchStage = bson.M{"repoId": repoID}
	}

	// ── 1. Fetch all runs sorted by (workflowName, startedAt) for MTTR ──
	type RunSlim struct {
		WorkflowName string    `bson:"workflowName"`
		Conclusion   string    `bson:"conclusion"`
		StartedAt    primitive.DateTime `bson:"startedAt"`
		Duration     float64   `bson:"duration"`
	}

	opts := options.Find().SetSort(bson.D{{Key: "workflowName", Value: 1}, {Key: "startedAt", Value: 1}})
	cursor, _ = runsColl.Find(context.TODO(), matchStage, opts)
	var allRuns []RunSlim
	_ = cursor.All(context.TODO(), &allRuns)

	// ── 2. Compute MTTR per workflow ──
	type MTTREntry struct {
		Workflow string  `json:"workflow"`
		AvgMTTR  float64 `json:"avgMttr"` // seconds
		Count    int     `json:"count"`
	}
	mttrByWorkflow := map[string][]float64{}
	// Group by workflow
	workflowRuns := map[string][]RunSlim{}
	for _, r := range allRuns {
		workflowRuns[r.WorkflowName] = append(workflowRuns[r.WorkflowName], r)
	}
	for wf, runs := range workflowRuns {
		for i := 0; i < len(runs)-1; i++ {
			if runs[i].Conclusion == "failure" {
				// Find next success after this failure
				for j := i + 1; j < len(runs); j++ {
					if runs[j].Conclusion == "success" {
						failTime := runs[i].StartedAt.Time()
						recoverTime := runs[j].StartedAt.Time()
						mttrSecs := recoverTime.Sub(failTime).Seconds()
						if mttrSecs > 0 {
							mttrByWorkflow[wf] = append(mttrByWorkflow[wf], mttrSecs)
						}
						break
					}
				}
			}
		}
	}
	var mttrList []MTTREntry
	overallMTTRSum := 0.0
	overallMTTRCount := 0
	for wf, vals := range mttrByWorkflow {
		if len(vals) == 0 {
			continue
		}
		sum := 0.0
		for _, v := range vals {
			sum += v
		}
		avg := sum / float64(len(vals))
		overallMTTRSum += avg
		overallMTTRCount++
		mttrList = append(mttrList, MTTREntry{Workflow: wf, AvgMTTR: avg, Count: len(vals)})
	}
	overallMTTR := 0.0
	if overallMTTRCount > 0 {
		overallMTTR = overallMTTRSum / float64(overallMTTRCount)
	}

	// ── 3. Build Cost Estimate (GitHub Actions Linux: $0.008/min) ──
	totalDurationSecs := 0.0
	for _, r := range allRuns {
		totalDurationSecs += r.Duration
	}
	totalMinutes := totalDurationSecs / 60.0
	costEstimateUSD := totalMinutes * 0.008

	// ── 4. Day-of-week failure heatmap ──
	// MongoDB aggregation: group by day-of-week
	dowPipeline := mongo.Pipeline{
		{{Key: "$match", Value: matchStage}},
		{{Key: "$group", Value: bson.M{
			"_id": bson.M{"$dayOfWeek": "$startedAt"}, // 1=Sun, 2=Mon ... 7=Sat
			"total":    bson.M{"$sum": 1},
			"failures": bson.M{"$sum": bson.M{
				"$cond": bson.A{bson.M{"$eq": bson.A{"$conclusion", "failure"}}, 1, 0},
			}},
		}}},
		{{Key: "$sort", Value: bson.D{{Key: "_id", Value: 1}}}},
	}
	cursor, _ = runsColl.Aggregate(context.TODO(), dowPipeline)
	var dowData []bson.M
	_ = cursor.All(context.TODO(), &dowData)

	dayNames := []string{"", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"}
	type DowEntry struct {
		Day      string `json:"day"`
		Total    int32  `json:"total"`
		Failures int32  `json:"failures"`
	}
	var heatmap []DowEntry
	for _, d := range dowData {
		idx, _ := d["_id"].(int32)
		if idx >= 1 && int(idx) < len(dayNames) {
			total, _ := d["total"].(int32)
			failures, _ := d["failures"].(int32)
			heatmap = append(heatmap, DowEntry{Day: dayNames[idx], Total: total, Failures: failures})
		}
	}

	// ── 5. Build Time Regression: last 7 days vs prior 7 days avg duration ──
	now := primitive.NewDateTimeFromTime(primitive.NewObjectID().Timestamp()) // approximate now
	_ = now
	// Use aggregation with date math
	regressionPipeline := mongo.Pipeline{
		{{Key: "$match", Value: matchStage}},
		{{Key: "$addFields", Value: bson.M{
			"period": bson.M{
				"$cond": bson.A{
					bson.M{"$gte": bson.A{"$startedAt", bson.M{"$dateSubtract": bson.M{
						"startDate": "$$NOW", "unit": "day", "amount": 7,
					}}}},
					"recent",
					bson.M{"$cond": bson.A{
						bson.M{"$gte": bson.A{"$startedAt", bson.M{"$dateSubtract": bson.M{
							"startDate": "$$NOW", "unit": "day", "amount": 14,
						}}}},
						"prior",
						"older",
					}},
				},
			},
		}}},
		{{Key: "$match", Value: bson.M{"period": bson.M{"$in": []string{"recent", "prior"}}}}},
		{{Key: "$group", Value: bson.M{
			"_id":         "$period",
			"avgDuration": bson.M{"$avg": "$duration"},
			"count":       bson.M{"$sum": 1},
		}}},
	}
	cursor, _ = runsColl.Aggregate(context.TODO(), regressionPipeline)
	var regressionRaw []bson.M
	_ = cursor.All(context.TODO(), &regressionRaw)

	type RegressionResult struct {
		RecentAvg    float64 `json:"recentAvg"`
		PriorAvg     float64 `json:"priorAvg"`
		ChangePercent float64 `json:"changePercent"`
		IsRegression  bool    `json:"isRegression"`
		RecentCount  int32   `json:"recentCount"`
		PriorCount   int32   `json:"priorCount"`
	}
	regression := RegressionResult{}
	for _, r := range regressionRaw {
		period, _ := r["_id"].(string)
		avg, _ := r["avgDuration"].(float64)
		count, _ := r["count"].(int32)
		if period == "recent" {
			regression.RecentAvg = avg
			regression.RecentCount = count
		} else if period == "prior" {
			regression.PriorAvg = avg
			regression.PriorCount = count
		}
	}
	if regression.PriorAvg > 0 {
		regression.ChangePercent = ((regression.RecentAvg - regression.PriorAvg) / regression.PriorAvg) * 100
		regression.IsRegression = regression.ChangePercent > 20 // >20% slower = regression
	}

	c.JSON(http.StatusOK, gin.H{
		"mttr":          mttrList,
		"overallMTTR":   overallMTTR,
		"totalMinutes":  totalMinutes,
		"costEstimateUSD": costEstimateUSD,
		"heatmap":       heatmap,
		"regression":    regression,
	})
}
