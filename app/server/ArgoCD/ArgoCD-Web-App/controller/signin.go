package controller

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	jwt "github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"golang.org/x/crypto/bcrypt"
)

// Credentials represents the user credentials for signin
type Credentials struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func isUserExists(email string, password string) (bool, bson.M) {
	// Connect to the MongoDB
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		fmt.Println("Error: ", err)
		return false, bson.M{}
	}
	defer mongoClient.Disconnect(context.TODO())

	// Get the collection
	collection := mongoClient.Database("admin").Collection("users")

	// Find the user with the given email
	var result bson.M
	err = collection.FindOne(context.TODO(), bson.D{{Key: "email", Value: email}}).Decode(&result)
	if err != nil {
		fmt.Println("Error: ", err)
		return false, bson.M{}
	}

	log.Println("User found: ", result)

	// Compare the stored hashed password with the given password
	hashedPassword := result["password"].(string)
	err = bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	if err != nil {
		fmt.Println("Error: ", err)
		return false, bson.M{}
	}

	return true, result
}

func generateToken(email string) (string, error) {
	// Load .env file
	err := godotenv.Load(".env")
	if err != nil {
		return "", err
	}
	var jwtSecret = []byte(os.Getenv("JWT_SECRET"))
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"email": email,
		"exp":   time.Now().Add(time.Hour * 24).Unix(), // Token expires after 1 day
	})

	// Sign and get the complete encoded token as a string
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func Signin(c *gin.Context) {
	// Parse request body
	var credentials Credentials
	if err := c.BindJSON(&credentials); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	// Check if the user exists
	// if !isUserExists(credentials.Email, credentials.Password) {
	// 	c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
	// 	return
	// }
	isExist,result := isUserExists(credentials.Email, credentials.Password);
	if !isExist {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generate JWT token
	token, err := generateToken(credentials.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
		return
	}

	// Set the token in the Authorization header
	// c.Header("Authorization", "Bearer "+token)

	// Send token and message in response body
	c.JSON(http.StatusOK, gin.H{
		"message": "User signed in successfully",
		"token":   token,
		"name": result["name"].(string),
		"companyname": result["companyname"].(string),
		"email": result["email"].(string),
	})
}
