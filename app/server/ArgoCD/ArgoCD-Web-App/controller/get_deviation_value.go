package controller

import (
	"context"
	"net/http"
	"time"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

func GetDeviationValue(c *gin.Context) {
	// Get user email
	userEmail := GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(200, gin.H{"deviationValue": "10"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	collection := mongoClient.Database("admin").Collection("deviations")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"userId": userEmail}
	var result bson.M
	err = collection.FindOne(ctx, filter).Decode(&result)
	if err != nil {
		c.JSON(200, gin.H{"deviationValue": "10"})
		return
	}
	c.JSON(200, gin.H{"deviationValue": result["value"].(string)})
}
