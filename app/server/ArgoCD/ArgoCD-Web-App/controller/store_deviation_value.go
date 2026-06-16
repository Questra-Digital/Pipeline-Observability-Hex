package controller

import (
	"context"
	"net/http"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Deviation struct {
	UserID string `bson:"userId" json:"userId"`
	Value  string `bson:"value" json:"value"`
}

func StoreDeviationValue(c *gin.Context) {
	var requestBody map[string]string
	if err := c.BindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	deviation_value := requestBody["deviation_value"]

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

	collection := mongoClient.Database("admin").Collection("deviations")

	filter := bson.M{"userId": userEmail}
	update := bson.M{"$set": bson.M{"value": deviation_value}}
	opts := options.Update().SetUpsert(true)

	_, err = collection.UpdateOne(context.TODO(), filter, update, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store deviation value"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deviation value saved successfully"})
}
