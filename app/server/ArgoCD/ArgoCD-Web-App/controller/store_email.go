// pipeline_name.go
package controller

import (
	"context"
	"net/http"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type UserEmailConfig struct {
	UserID string `bson:"userId" json:"userId"`
	Email  string `bson:"email" json:"email"`
}

func StoreEmailInMongoDB(c *gin.Context, email string, userId string) {
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		return
	}

	collection := mongoClient.Database("admin").Collection("emails")

	filter := bson.M{"userId": userId}
	update := bson.M{"$set": bson.M{"email": email}}
	opts := options.Update().SetUpsert(true)

	_, err = collection.UpdateOne(context.TODO(), filter, update, opts)
	if err != nil {
		return
	}
}

func StoreEmail(c *gin.Context) {
	// Parse request body
	var requestBody map[string]string
	if err := c.BindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	email := requestBody["email"]

	// Get user email
	userEmail := GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	StoreEmailInMongoDB(c, email, userEmail)
	fmt.Println("Email Saved successfully")
	c.JSON(http.StatusOK, gin.H{"message": "Email Saved successfully"})
}
