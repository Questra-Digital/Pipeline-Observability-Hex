package controller

import (
	"context"
	"net/http"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"golang.org/x/crypto/bcrypt"
)

// User represents the user data structure
type User struct {
	Email       string `json:"email" binding:"required,email"`
	Name        string `json:"name" binding:"required"`
	CompanyName string `json:"companyName" binding:"required"`
	Password    string `json:"password" binding:"required"`
}

func IsEmailExists(email string) bool {
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		return false
	}

	collection := mongoClient.Database("admin").Collection("users")

	err = collection.FindOne(context.TODO(), bson.D{{Key: "email", Value: email}}).Err()
	return err == nil
}

func HashPassword(password string) (string, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashedPassword), nil
}

func storeUser(user User) error {
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		return err
	}

	collection := mongoClient.Database("admin").Collection("users")

	hashedPassword, err := HashPassword(user.Password)
	if err != nil {
		return err
	}
	user.Password = string(hashedPassword)

	_, err = collection.InsertOne(context.TODO(), user)
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
	// user already exists
	if IsEmailExists(user.Email) {
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
