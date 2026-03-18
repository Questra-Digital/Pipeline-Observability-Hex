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

type Token struct {
	UserID string `bson:"userId" json:"userId"`
	Value  string `bson:"value" json:"value"`
}

func StoreTokenInMongoDB(c *gin.Context, token string, userId string) {
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		fmt.Println("Error: ", err)
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	collection := mongoClient.Database("admin").Collection("argocdToken")

	// Update the token for the specific user, or insert if it doesn't exist
	filter := bson.M{"userId": userId}
	update := bson.M{"$set": bson.M{"value": token}}
	opts := options.Update().SetUpsert(true)

	_, err = collection.UpdateOne(context.TODO(), filter, update, opts)
	if err != nil {
		fmt.Println("Error: ", err)
		return
	}
}

func StoreToken(c *gin.Context) {
	// Parse request body to get the "token" value
	var requestBody map[string]string
	if err := c.BindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	token := requestBody["token"]

	// Get user email
	userEmail := GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// validate the token
	isValidToken := TokenAuth(token, userEmail)
	if !isValidToken {
		c.JSON(http.StatusUnauthorized, gin.H{"Error": "Invalid Token"})
		return
	}

	// store the token in the database
	StoreTokenInMongoDB(c, token, userEmail)

	fmt.Println("Token Saved successfully")
	c.JSON(http.StatusOK, gin.H{"message": "Token Saved successfully"})
}
