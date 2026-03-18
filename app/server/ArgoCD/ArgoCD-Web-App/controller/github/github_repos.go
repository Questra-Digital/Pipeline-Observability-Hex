package github

import (
	"context"
	"log"
	"net/http"

	"github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller"
	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"github.com/google/go-github/v60/github"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"strconv"
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
			repos = syncReposFromGitHub(acc)
			if len(repos) > 0 {
				// Bulk insert into DB
				var interfaceRepos []interface{}
				for _, r := range repos {
					interfaceRepos = append(interfaceRepos, r)
				}
				_, _ = reposColl.InsertMany(context.TODO(), interfaceRepos)
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
			break
		}
		for _, r := range repos {
			repoOwner := r.GetOwner().GetLogin()
			// Check if repository has workflows
			workflows, _, err := client.Actions.ListWorkflows(ctx, repoOwner, r.GetName(), &github.ListOptions{PerPage: 1})
			if err != nil || workflows.GetTotalCount() == 0 {
				continue // Skip repositories without workflows
			}

			allRepos = append(allRepos, Repository{
				ID:          r.GetID(),
				AccountID:   acc.ID,
				Name:        r.GetName(),
				Owner:       repoOwner,
				FullName:    r.GetFullName(),
				Enabled:     false, // Disabled by default
				Description: r.GetDescription(),
			})
		}
		if resp.NextPage == 0 {
			break
		}
		opt.Page = resp.NextPage
	}
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

	// 4. Time Series Trend
	durationPipeline := mongo.Pipeline{
		{{Key: "$match", Value: matchStage}},
		{{Key: "$sort", Value: bson.D{{Key: "startedAt", Value: 1}}}},
		{{Key: "$group", Value: bson.M{
			"_id":         bson.M{"$dateToString": bson.M{"format": "%Y-%m-%d", "date": "$startedAt"}},
			"avgDuration": bson.M{"$avg": "$duration"},
			"totalRuns":   bson.M{"$sum": 1},
		}}},
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
	url, _, err := ghClient.Actions.GetWorkflowJobLogs(context.TODO(), repoOwner, repoName, jobID, 10)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching logs from GitHub"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": url.String()})
}
