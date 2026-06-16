package controller

import (
	"context"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	jwt "github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"golang.org/x/crypto/bcrypt"
)

var (
	jwtGenerateOnce sync.Once
	jwtGenerateKey  []byte
)

func getJWTGenerateKey() []byte {
	jwtGenerateOnce.Do(func() {
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			log.Fatal("[FATAL] JWT_SECRET environment variable is not set")
		}
		jwtGenerateKey = []byte(secret)
	})
	return jwtGenerateKey
}

type Credentials struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func isUserExists(email string, password string) (bool, bson.M) {
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		return false, bson.M{}
	}

	collection := mongoClient.Database("admin").Collection("users")

	var result bson.M
	err = collection.FindOne(context.TODO(), bson.D{{Key: "email", Value: email}}).Decode(&result)
	if err != nil {
		return false, bson.M{}
	}

	hashedPassword, ok := result["password"].(string)
	if !ok {
		return false, bson.M{}
	}
	err = bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	if err != nil {
		return false, bson.M{}
	}

	return true, result
}

func safeString(m bson.M, key string) string {
	v, ok := m[key]
	if !ok || v == nil {
		return ""
	}
	s, ok := v.(string)
	if !ok {
		return ""
	}
	return s
}

func generateToken(email string) (string, error) {
	secret := getJWTGenerateKey()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"email": email,
		"exp":   time.Now().Add(time.Hour * 24).Unix(),
	})
	tokenString, err := token.SignedString(secret)
	if err != nil {
		return "", err
	}
	return tokenString, nil
}

func Signin(c *gin.Context) {
	var credentials Credentials
	if err := c.BindJSON(&credentials); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	isExist, result := isUserExists(credentials.Email, credentials.Password)
	if !isExist {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	token, err := generateToken(credentials.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "User signed in successfully",
		"token":       token,
		"name":        safeString(result, "name"),
		"companyname": safeString(result, "companyname"),
		"email":       safeString(result, "email"),
	})
}
