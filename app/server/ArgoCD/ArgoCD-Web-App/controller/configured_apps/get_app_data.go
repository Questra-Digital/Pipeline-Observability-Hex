package configuredapps

import (
	"context"
	"log"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

// GetAllApps is the API function for getting all the configured apps data
// slack(botId, ChannelId), Email and ArgoCD Token
func GetAllApps(c *gin.Context) {
	// Connect to the MongoDB
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(500, gin.H{"error": "Internal server error"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())
	// Get the collection
	collection := mongoClient.Database("admin").Collection("slack")
	// Find the slack bot and channel
	var slackBot bson.M
	err = collection.FindOne(context.TODO(), bson.D{}).Decode(&slackBot)
	if err != nil {
		log.Println("Error: ", err)
	}
	// Get the collection
	collection = mongoClient.Database("admin").Collection("emails")
	// Find the email notification status
	var emailNotification bson.M
	err = collection.FindOne(context.TODO(), bson.D{}).Decode(&emailNotification)
	if err != nil {
		log.Println("Error: ", err)
	}
	// Get the collection
	collection = mongoClient.Database("admin").Collection("argocdToken")
	// Find the ArgoCD token
	var argocdToken bson.M
	err = collection.FindOne(context.TODO(), bson.D{}).Decode(&argocdToken)
	if err != nil {
		log.Println("Error: ", err)
	}
	// Return the configured apps data
	c.JSON(200, gin.H{
		"slack":  slackBot,
		"email":  emailNotification,
		"argocd": argocdToken,
	})
}
