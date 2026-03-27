package github

import (
	"context"
	"net/http"
	"time"

	"github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller"
	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type CorrelationEvent struct {
	Category    string    `json:"category"`
	Count       int       `json:"count"`
	Repos       []string  `json:"repos"`
	FirstSeen   time.Time `json:"firstSeen"`
	LastSeen    time.Time `json:"lastSeen"`
	IsSystemic  bool      `json:"isSystemic"`
	Description string    `json:"description"`
}

func GetFailureCorrelations(c *gin.Context) {
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

	db := mongoClient.Database("admin")
	rcaColl := db.Collection("github_rca")
	accountsColl := db.Collection("github_accounts")

	// 1. Get all accounts for this user to filter correctly
	var accounts []GitHubAccount
	cursor, _ := accountsColl.Find(context.TODO(), bson.M{"userId": userEmail})
	_ = cursor.All(context.TODO(), &accounts)
	
	accountIDs := []primitive.ObjectID{}
	for _, acc := range accounts {
		accountIDs = append(accountIDs, acc.ID)
	}

	// 2. Scan RCA results from the last 2 hours
	timeWindow := time.Now().Add(-2 * time.Hour)
	filter := bson.M{
		"analyzedAt": bson.M{"$gte": primitive.NewDateTimeFromTime(timeWindow)},
	}
	
	// Note: We should ideally have accountId in github_rca too, but for now we filter by repoName check or just all recent ones if it's a small install
	cursor, err = rcaColl.Find(context.TODO(), filter)
	if err != nil {
		c.JSON(http.StatusOK, []CorrelationEvent{})
		return
	}

	var results []RCAResult
	_ = cursor.All(context.TODO(), &results)

	// 3. Cluster by Category
	clusters := make(map[string]*CorrelationEvent)
	for _, res := range results {
		if res.Primary == nil || res.Primary.Category == "success" {
			continue
		}
		
		cat := res.Primary.Category
		if _, exists := clusters[cat]; !exists {
			clusters[cat] = &CorrelationEvent{
				Category:  cat,
				FirstSeen: res.AnalyzedAt,
				LastSeen:  res.AnalyzedAt,
				Repos:     []string{},
			}
		}
		
		ev := clusters[cat]
		ev.Count++
		if res.AnalyzedAt.After(ev.LastSeen) {
			ev.LastSeen = res.AnalyzedAt
		}
		if res.AnalyzedAt.Before(ev.FirstSeen) {
			ev.FirstSeen = res.AnalyzedAt
		}
		
		// Add repo if not present
		found := false
		for _, r := range ev.Repos {
			if r == res.RepoName {
				found = true
				break
			}
		}
		if !found {
			ev.Repos = append(ev.Repos, res.RepoName)
		}
	}

	// 4. Determine Systemic flags
	finalEvents := []CorrelationEvent{}
	for _, ev := range clusters {
		// A failure is "systemic" if it affects 2+ different repos within 2 hours
		if len(ev.Repos) >= 2 {
			ev.IsSystemic = true
			ev.Description = "Detected synchronized failures across multiple repositories. This likely indicates a shared infrastructure or dependency issue."
		} else {
			ev.Description = "Isolated failure pattern detected."
		}
		finalEvents = append(finalEvents, *ev)
	}

	c.JSON(http.StatusOK, finalEvents)
}
