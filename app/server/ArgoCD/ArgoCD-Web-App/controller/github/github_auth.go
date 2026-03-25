package github

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller"
	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"github.com/google/go-github/v60/github"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type GitHubAccount struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID       string             `bson:"userId" json:"userId"`
	PAT          string             `bson:"pat" json:"-"`
	Label        string             `bson:"label" json:"label"`
	Owner        string             `bson:"owner" json:"owner"`
	AvatarURL    string             `bson:"avatarUrl" json:"avatarUrl"`
	CreatedAt    time.Time          `bson:"createdAt" json:"createdAt"`
	SyncInterval int                `bson:"syncInterval" json:"syncInterval"`
}

type AuthRequest struct {
	PAT          string `json:"pat" binding:"required"`
	Label        string `json:"label"`
	SyncInterval int    `json:"syncInterval"`
}

func ConnectGitHubAccount(c *gin.Context) {
	var req AuthRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	userEmail := controller.GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Verify PAT with GitHub
	ctx := context.Background()
	client := github.NewClient(nil).WithAuthToken(req.PAT)
	user, resp, err := client.Users.Get(ctx, "")
	if err != nil {
		statusCode := 0
		if resp != nil {
			statusCode = resp.StatusCode
		}
		errMsg := fmt.Sprintf("GitHub API error (HTTP %d): %s", statusCode, err.Error())
		c.JSON(http.StatusUnauthorized, gin.H{"message": errMsg})
		return
	}

	// Connect to MongoDB
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}
	defer mongoClient.Disconnect(ctx)

	collection := mongoClient.Database("admin").Collection("github_accounts")

	syncInterval := req.SyncInterval
	if syncInterval < 1 {
		syncInterval = 3 // Default 3s
	}

	acc := GitHubAccount{
		ID:           primitive.NewObjectID(),
		UserID:       userEmail,
		PAT:          req.PAT,
		Label:        req.Label,
		Owner:        user.GetLogin(),
		AvatarURL:    user.GetAvatarURL(),
		SyncInterval: syncInterval,
		CreatedAt:    time.Now(),
	}

	_, err = collection.InsertOne(ctx, acc)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save account"})
		return
	}

	c.JSON(http.StatusOK, acc)
}

func GetGitHubAccounts(c *gin.Context) {
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

	collection := mongoClient.Database("admin").Collection("github_accounts")
	
	var accounts []GitHubAccount
	cursor, err := collection.Find(context.TODO(), bson.M{"userId": userEmail}, options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch accounts"})
		return
	}
	if err = cursor.All(context.TODO(), &accounts); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error decoding accounts"})
		return
	}

	if accounts == nil {
		accounts = []GitHubAccount{}
	}

	c.JSON(http.StatusOK, accounts)
}

func DisconnectGitHubAccount(c *gin.Context) {
	idStr := c.Param("id")
	objID, err := primitive.ObjectIDFromHex(idStr)
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

	// Delete account
	accountsColl := mongoClient.Database("admin").Collection("github_accounts")
	_, err = accountsColl.DeleteOne(context.TODO(), bson.M{"_id": objID, "userId": userEmail})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete account"})
		return
	}

	// Also delete associated repos
	reposColl := mongoClient.Database("admin").Collection("github_repos")
	_, _ = reposColl.DeleteMany(context.TODO(), bson.M{"accountId": objID})

	// Also delete associated runs
	runsColl := mongoClient.Database("admin").Collection("github_runs")
	_, _ = runsColl.DeleteMany(context.TODO(), bson.M{"accountId": objID})

	c.JSON(http.StatusOK, gin.H{"message": "Account disconnected successfully"})
}

func UpdateGitHubSyncInterval(c *gin.Context) {
	var req struct {
		AccountID string `json:"accountId" binding:"required"`
		Interval  int    `json:"interval" binding:"required"`
	}
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	objID, err := primitive.ObjectIDFromHex(req.AccountID)
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

	collection := mongoClient.Database("admin").Collection("github_accounts")
	filter := bson.M{"_id": objID, "userId": userEmail}
	update := bson.M{"$set": bson.M{"syncInterval": req.Interval}}

	_, err = collection.UpdateOne(context.TODO(), filter, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update sync interval"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Sync interval updated successfully", "interval": req.Interval})
}
