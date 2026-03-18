package configuredapps

import (
	"context"
	"log"
	"net/http"

	"github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller"
	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

// GetAllApps is the API function for getting all the configured apps data
// slack(botId, ChannelId), Email and ArgoCD Token
func GetAllApps(c *gin.Context) {
	// Get user email
	userEmail := controller.GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Connect to the MongoDB
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(500, gin.H{"error": "Internal server error"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	filter := bson.M{"userId": userEmail}

	// Get the collection
	collection := mongoClient.Database("admin").Collection("slack")
	// Find the slack bot and channel
	var slackBot bson.M
	err = collection.FindOne(context.TODO(), filter).Decode(&slackBot)
	if err != nil {
		log.Println("Error fetching slack config: ", err)
	}

	// Get the collection
	collection = mongoClient.Database("admin").Collection("emails")
	// Find the email configuration
	var emailNotification bson.M
	err = collection.FindOne(context.TODO(), filter).Decode(&emailNotification)
	if err != nil {
		log.Println("Error fetching email config: ", err)
	}

	// Get the collection
	collection = mongoClient.Database("admin").Collection("argocdToken")
	var argocdToken bson.M
	err = collection.FindOne(context.TODO(), filter).Decode(&argocdToken)
	if err != nil {
		log.Println("Error fetching argocd token: ", err)
	}

	// Also check ArgoCD API URL
	collection = mongoClient.Database("admin").Collection("argocd_api")
	var argocdURL bson.M
	err = collection.FindOne(context.TODO(), filter).Decode(&argocdURL)
	if err != nil {
		log.Println("Error fetching argocd url: ", err)
	}

	// Use combined status for argo
	var argoStatus interface{}
	if argocdToken != nil {
		argoStatus = argocdToken
	} else if argocdURL != nil {
		argoStatus = argocdURL
	} else {
		argoStatus = nil
	}

	// NEW: Check GitHub authentication
	collection = mongoClient.Database("admin").Collection("github_accounts")
	var githubAccount bson.M
	err = collection.FindOne(context.TODO(), filter).Decode(&githubAccount)
	if err != nil {
		log.Println("Error fetching github config: ", err)
	}

	// Return the configured apps data
	// Keys must match frontend constants/integrations.js name field
	c.JSON(200, gin.H{
		"slack":  slackBot,           // if not found, slackBot is nil -> null in JSON
		"email":  emailNotification,  // if not found, emailNotification is nil -> null in JSON
		"argocd": argoStatus,
		"github": githubAccount,
	})
}
