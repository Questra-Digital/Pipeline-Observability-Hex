package controller

import (
	"context"
	"log"
	"net/http"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

type PasswordCredentials struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"newPassword" binding:"required"`
}

func UpdatePassword(email string, password string) error {
	// log.Println("Email: ", email, "New Password: ", password)
	// Connect to the MongoDB
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		log.Println("Error: ", err)
		return err
	}
	defer mongoClient.Disconnect(context.TODO())
	// hash the password
	hashedPassword, err := HashPassword(password)
	if err != nil {
		return err
	}
	// update the password
	collection := mongoClient.Database("admin").Collection("users")
	_, err = collection.UpdateOne(
		context.TODO(),
		bson.M{"email": email},
		bson.M{"$set": bson.M{"password": hashedPassword}},
	)
	if err != nil {
		log.Println("Error: ", err)
		return err
	}
	return nil
}

// ForgetPass is the API function for handling forget password requests
func ForgetPass(c *gin.Context) {
	// Parse request body
	var credentials PasswordCredentials
	if err := c.BindJSON(&credentials); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	// check if the user exists
	if !IsEmailExists(credentials.Email) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User does not exist"})
		return
	}
	// update the password
	err := UpdatePassword(credentials.Email, credentials.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not update password"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "Password reset successful",
	})
}
