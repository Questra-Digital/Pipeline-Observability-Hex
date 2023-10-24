// pipeline_name.go
package controller

import (
	"context"
	"fmt"
	"net/http"
	mongoconnection "test-app/mongoConnection"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

const dbName = "admin"
const collectionName = "argocdTokens"

func StoreToken(c *gin.Context, email, token string) {
	// validate the token
	isValidToken := TokenAuth(token)
	if !isValidToken {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid Token"})
		return
	}

	// MongoDB connection
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		fmt.Println("Error connecting to MongoDB:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	// Get a handle to the database and collection
	database := mongoClient.Database(dbName)
	collection := database.Collection(collectionName)

	// Check if the email already exists
	filter := bson.M{"email": email}
	existingDocument := collection.FindOne(context.TODO(), filter)

	if existingDocument.Err() == nil {
		// Email already exists, do not insert
		c.JSON(http.StatusConflict, gin.H{"message": "Email already registered"})
		return
	}

	// Email does not exist, insert the new document
	newDocument := bson.M{
		"email": email,
		"token": token,
	}

	_, err = collection.InsertOne(context.TODO(), newDocument)
	if err != nil {
		fmt.Println("Error inserting document:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal Server Error"})
		return
	}

	fmt.Println("Token inserted successfully")
	c.JSON(http.StatusOK, gin.H{"message": "Token inserted successfully"})
}
