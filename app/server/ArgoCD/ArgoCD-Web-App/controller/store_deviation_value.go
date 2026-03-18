package controller

import (
	"context"
	"fmt"
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

func StoreDeviationValue(c *gin.Context, deviation_value string) {
	// Get user email
	userEmail := GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		fmt.Println("Error: ", err)
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	collection := mongoClient.Database("admin").Collection("deviations")

	// Update for specific user, or insert if not exists
	filter := bson.M{"userId": userEmail}
	update := bson.M{"$set": bson.M{"value": deviation_value}}
	opts := options.Update().SetUpsert(true)

	_, err = collection.UpdateOne(context.TODO(), filter, update, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store deviation value"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deviation Value inserted...."})
}
