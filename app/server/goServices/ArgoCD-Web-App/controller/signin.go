package controller

import (
	"context"
	"fmt"
	"net/http"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD/mongoConnection"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"golang.org/x/crypto/bcrypt"
)

// Credentials represents the user credentials for signin
type Credentials struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func isUserExists(email string, password string) bool {
	// Connect to the MongoDB
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		fmt.Println("Error: ", err)
		return false
	}
	defer mongoClient.Disconnect(context.TODO())

	// Get the collection
	collection := mongoClient.Database("admin").Collection("users")

	// Find the user with the given email
	var result bson.M
	err = collection.FindOne(context.TODO(), bson.D{{"email", email}}).Decode(&result)
	if err != nil {
		fmt.Println("Error: ", err)
		return false
	}

	// Compare the stored hashed password with the given password
	hashedPassword := result["password"].(string)
	err = bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	if err != nil {
		fmt.Println("Error: ", err)
		return false
	}

	return true
}

func Signin(c *gin.Context) {
	// Parse request body
	var credentials Credentials
	if err := c.BindJSON(&credentials); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	// Check if the user exists
	if !isUserExists(credentials.Email, credentials.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User signed in successfully"})
}
