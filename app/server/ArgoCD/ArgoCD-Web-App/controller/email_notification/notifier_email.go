package controller

import (
	"context"
	"fmt"
	"net/http"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

func StoreNotifierEmail(c *gin.Context) {
	var emailCredentials map[string]string
	if err := c.BindJSON(&emailCredentials); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	email := emailCredentials["email"]
	password := emailCredentials["password"]

	fmt.Println("Email: ", email)
	fmt.Println("Password: ", password)
	// connect to MongoDB
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer mongoClient.Disconnect(context.Background())
	collection := mongoClient.Database("notification").Collection("email_notifier")
	// delete existing email and password
	_, err = collection.DeleteMany(context.Background(), bson.D{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// store email and password in MongoDB
	_, err = collection.InsertOne(context.Background(), bson.D{
		{Key: "email", Value: email},
		{Key: "password", Value: password},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Email stored successfully"})
}

func GetNotifierEmail(c *gin.Context) {
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer mongoClient.Disconnect(context.Background())
	collection := mongoClient.Database("notification").Collection("email_notifier")
	var result bson.M
	err = collection.FindOne(context.Background(), bson.D{}).Decode(&result)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"email": result["email"], "password": result["password"]})
}
