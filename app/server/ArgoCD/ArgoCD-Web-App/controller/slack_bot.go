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

func StoreBotIdAndTokenInMongoDB(token string, channel string, userId string) error {
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		return err
	}

	collection := mongoClient.Database("admin").Collection("slack")

	filter := bson.M{"userId": userId}
	update := bson.M{"$set": bson.M{"token": token, "channel": channel}}
	opts := options.Update().SetUpsert(true)

	_, err = collection.UpdateOne(context.TODO(), filter, update, opts)
	if err != nil {
		return err
	}

	return nil
}

func StoreSlackBot(c *gin.Context) {
	var requestBody map[string]string
	if err := c.BindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	userEmail := GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	if err := StoreBotIdAndTokenInMongoDB(requestBody["token"], requestBody["channel"], userEmail); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store the slack bot token and channel"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Slack bot token and channel stored successfully"})
}
