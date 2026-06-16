package controller

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"net/http"
	"time"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type DashboardStats struct {
	TotalGitHubAccounts   int64         `json:"totalGitHubAccounts"`
	TotalGitHubRepos      int64         `json:"totalGitHubRepos"`
	TotalArgoCDConnectors int64         `json:"totalArgoCDConnectors"`
	TotalArgoCDPipelines  int           `json:"totalArgoCDPipelines"`
	TotalIntegrations     int64         `json:"totalIntegrations"`
	GlobalSuccessRate     float64       `json:"globalSuccessRate"`
	TotalBuilds24h        int64         `json:"totalBuilds24h"`
	RecentAnomalies       []bson.M      `json:"recentAnomalies"`
}

func GetDashboardStats(c *gin.Context) {
	userEmail := GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}

	db := mongoClient.Database("admin")
	ghAccountsColl := db.Collection("github_accounts")
	ghReposColl := db.Collection("github_repos")
	ghRunsColl := db.Collection("github_runs")

	// 1. Integrations Counts
	githubAccountsCount, _ := ghAccountsColl.CountDocuments(context.Background(), bson.M{"userId": userEmail})
	argocdAPIColl := db.Collection("argocd_api")
	argocdConnectorsCount, _ := argocdAPIColl.CountDocuments(context.Background(), bson.M{"userId": userEmail})

	// 2. Repos and Apps
	var accounts []bson.M
	cursor, _ := ghAccountsColl.Find(context.Background(), bson.M{"userId": userEmail})
	_ = cursor.All(context.Background(), &accounts)
	accountIDs := []interface{}{}
	for _, acc := range accounts {
		accountIDs = append(accountIDs, acc["_id"])
	}

	githubReposCount, _ := ghReposColl.CountDocuments(context.Background(), bson.M{"accountId": bson.M{"$in": accountIDs}, "enabled": true})

	argocdPipelinesCount := 0
	pipelineNames, err := fetchArgoCDPipelineNames(userEmail, db)
	if err == nil {
		argocdPipelinesCount = len(pipelineNames)
	}

	// 3. ENHANCED: Global Analytics (Last 24h)
	oneDayAgo := primitive.NewDateTimeFromTime(time.Now().Add(-24 * time.Hour))
	filter24h := bson.M{
		"accountId": bson.M{"$in": accountIDs},
		"startedAt": bson.M{"$gte": oneDayAgo},
	}
	total24h, _ := ghRunsColl.CountDocuments(context.Background(), filter24h)
	success24h, _ := ghRunsColl.CountDocuments(context.Background(), bson.M{
		"accountId":  bson.M{"$in": accountIDs},
		"startedAt":  bson.M{"$gte": oneDayAgo},
		"conclusion": "success",
	})

	globalSuccessRate := 0.0
	if total24h > 0 {
		globalSuccessRate = (float64(success24h) / float64(total24h)) * 100
	}

	// 4. ENHANCED: Recent Anomalies
	opts := options.Find().SetSort(bson.D{{Key: "startedAt", Value: -1}}).SetLimit(3)
	anomalyFilter := bson.M{
		"accountId":    bson.M{"$in": accountIDs},
		"anomalyScore": bson.M{"$gt": 0},
	}
	cursor, _ = ghRunsColl.Find(context.Background(), anomalyFilter, opts)
	var recentAnomalies []bson.M
	_ = cursor.All(context.Background(), &recentAnomalies)

	stats := DashboardStats{
		TotalGitHubAccounts:   githubAccountsCount,
		TotalGitHubRepos:      githubReposCount,
		TotalArgoCDConnectors: argocdConnectorsCount,
		TotalArgoCDPipelines:  argocdPipelinesCount,
		TotalIntegrations:     githubAccountsCount + argocdConnectorsCount,
		GlobalSuccessRate:     globalSuccessRate,
		TotalBuilds24h:        total24h,
		RecentAnomalies:       recentAnomalies,
	}

	c.JSON(http.StatusOK, stats)
}

func fetchArgoCDPipelineNames(userId string, db *mongo.Database) ([]string, error) {
	// Reusing logic from GetAllPipelineNames but with passed DB connection
	filter := bson.M{"userId": userId}
	
	var apiResult bson.M
	err := db.Collection("argocd_api").FindOne(context.Background(), filter).Decode(&apiResult)
	if err != nil {
		return nil, err
	}
	url, ok := apiResult["argocdURL"].(string)
	if !ok {
		return nil, nil
	}

	var tokenResult bson.M
	err = db.Collection("argocdToken").FindOne(context.Background(), filter).Decode(&tokenResult)
	if err != nil {
		return nil, err
	}
	token, ok := tokenResult["value"].(string)
	if !ok {
		return nil, nil
	}

	bearer := "Bearer " + token
	req, err := http.NewRequest("GET", url, bytes.NewBuffer(nil))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", bearer)
	req.Header.Add("Accept", "application/json")

	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Transport: tr, Timeout: 5 * time.Second}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, nil
	}

	var responseData struct {
		Items []struct {
			Metadata struct {
				Name string `json:"name"`
			} `json:"metadata"`
		} `json:"items"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&responseData); err != nil {
		return nil, err
	}

	var names []string
	for _, item := range responseData.Items {
		names = append(names, item.Metadata.Name)
	}
	return names, nil
}
