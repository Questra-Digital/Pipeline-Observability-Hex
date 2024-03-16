package controller

import (
	"context"
	"log"
	"net/http"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

// store the slack bot token and channel in mongoDB
func StoreBotIdAndTokenInMongoDB(token string, channel string) error {
	// Connect to the MongoDB
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		log.Println("Error: ", err)
		return err
	}
	defer mongoClient.Disconnect(context.TODO())

	// Get the collection
	collection := mongoClient.Database("admin").Collection("slack")
	// before inserting the slack bot and channel, clear the collection
	_, err = collection.DeleteMany(context.TODO(), bson.D{})
	if err != nil {
		log.Println("Error: ", err)
		return err
	}

	// Insert the slack bot token and channel
	_, err = collection.InsertOne(context.TODO(), bson.D{
		{Key: "token", Value: token},
		{Key: "channel", Value: channel},
	})
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
	log.Println("Slack bot token: ", requestBody["token"])
	log.Println("Slack bot channel: ", requestBody["channel"])

	// store the slack bot token and channel in mongoDB
	if err := StoreBotIdAndTokenInMongoDB(requestBody["token"], requestBody["channel"]); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store the slack bot token and channel"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Slack bot token and channel stored successfully"})
}
