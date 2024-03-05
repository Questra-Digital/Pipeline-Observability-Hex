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

// User represents the user data structure
type User struct {
	Name            string `json:"name" binding:"required"`
	Email           string `json:"email" binding:"required,email"`
	CompanyName     string `json:"companyName" binding:"required"`
	Password        string `json:"password" binding:"required"`
	ConfirmPassword string `json:"confirmPassword" binding:"required"`
}

// DatabaseUser represents the user data structure for database storage
type DatabaseUser struct {
	Name        string `json:"name" bson:"name"`
	Email       string `json:"email" bson:"email"`
	CompanyName string `json:"companyName" bson:"companyName"`
	Password    string `json:"password" bson:"password"`
}

// check is email already exists
func isEmailExists(email string) bool {
	// Connect to the MongoDB
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		fmt.Println("Error: ", err)
		return false
	}
	defer mongoClient.Disconnect(context.TODO())

	// Get the collection
	collection := mongoClient.Database("admin").Collection("users")

	// Check if the email exists
	err = collection.FindOne(context.TODO(), bson.D{{"email", email}}).Err()
	return err == nil
}

// store user in the database
func storeUser(user User) error {
	// Connect to the MongoDB
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		fmt.Println("Error: ", err)
		return err
	}
	defer mongoClient.Disconnect(context.TODO())

	// Get the collection
	collection := mongoClient.Database("admin").Collection("users")
	// hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	user.Password = string(hashedPassword)

	// Create a DatabaseUser object without the ConfirmPassword field
	dbUser := DatabaseUser{
		Name:        user.Name,
		Email:       user.Email,
		CompanyName: user.CompanyName,
		Password:    user.Password,
	}
	// Insert the user without the ConfirmPassword field
	_, err = collection.InsertOne(context.TODO(), dbUser)
	if err != nil {
		return err
	}
	return nil
}

// function for signup route
func Signup(c *gin.Context) {
	// Parse request body to get email, name, company name, pass and confirm pass
	var user User
	if err := c.BindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	if user.Password != user.ConfirmPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password and confirm password do not match"})
		return
	}
	// user already exists
	if isEmailExists(user.Email) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User already exists"})
		return
	}

	// store user in the database
	err := storeUser(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// return success message
	c.JSON(http.StatusOK, gin.H{"message": "User created successfully"})
}
