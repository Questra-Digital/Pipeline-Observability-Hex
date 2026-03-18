package controller

import (
	"context"
	"net/http"

	"github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller"
	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func StoreNotifierEmail(c *gin.Context) {
	var emailCredentials map[string]string
	if err := c.BindJSON(&emailCredentials); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	email := emailCredentials["email"]
	password := emailCredentials["password"]

	// Get user email
	userEmail := controller.GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer mongoClient.Disconnect(context.Background())

	collection := mongoClient.Database("notification").Collection("email_notifier")

	// Update for specific user, or insert if not exists
	filter := bson.M{"userId": userEmail}
	update := bson.M{"$set": bson.M{"email": email, "password": password}}
	opts := options.Update().SetUpsert(true)

	_, err = collection.UpdateOne(context.Background(), filter, update, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Email stored successfully"})
}

func GetNotifierEmail(c *gin.Context) {
	// Get user email
	userEmail := controller.GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer mongoClient.Disconnect(context.Background())

	collection := mongoClient.Database("notification").Collection("email_notifier")
	var result bson.M
	err = collection.FindOne(context.Background(), bson.M{"userId": userEmail}).Decode(&result)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notifier email not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"email": result["email"], "password": result["password"]})
}
