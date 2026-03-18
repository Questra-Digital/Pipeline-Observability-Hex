package controller

import (
	"context"
	"log"
	"net/http"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// store the slack bot token and channel in mongoDB
func StoreBotIdAndTokenInMongoDB(token string, channel string, userId string) error {
	// Connect to the MongoDB
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		log.Println("Error: ", err)
		return err
	}
	defer mongoClient.Disconnect(context.TODO())

	// Get the collection
	collection := mongoClient.Database("admin").Collection("slack")

	// Update for specific user, or insert if not exists
	filter := bson.M{"userId": userId}
	update := bson.M{"$set": bson.M{"token": token, "channel": channel}}
	opts := options.Update().SetUpsert(true)

	_, err = collection.UpdateOne(context.TODO(), filter, update, opts)
	if err != nil {
		log.Println("Error: ", err)
		return err
	}

	return nil
}

func StoreSlackBot(c *gin.Context) {
	// parse request body to get the "token" and "channel" values
	var requestBody map[string]string
	if err := c.BindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Get user email
	userEmail := GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	log.Println("Slack bot token: ", requestBody["token"])
	log.Println("Slack bot channel: ", requestBody["channel"])

	// store the slack bot token and channel in mongoDB
	if err := StoreBotIdAndTokenInMongoDB(requestBody["token"], requestBody["channel"], userEmail); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store the slack bot token and channel"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Slack bot token and channel stored successfully"})
}
