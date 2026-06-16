package controller

import (
	"context"
	"net/http"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type CustomMessage struct {
	UserID string `bson:"userId" json:"userId"`
	Value  string `bson:"value" json:"value"`
}

func StoreCustomMessage(c *gin.Context) {
	var requestBody map[string]string
	if err := c.BindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	custom_message := requestBody["custom_message"]

	// Get user email
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

	collection := mongoClient.Database("admin").Collection("custom_messages")

	filter := bson.M{"userId": userEmail}
	update := bson.M{"$set": bson.M{"value": custom_message}}
	opts := options.Update().SetUpsert(true)

	_, err = collection.UpdateOne(context.TODO(), filter, update, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store custom message"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Custom Message saved successfully"})
}
