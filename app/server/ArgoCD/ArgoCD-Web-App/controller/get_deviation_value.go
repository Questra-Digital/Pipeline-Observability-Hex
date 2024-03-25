package controller

import (
	"context"
	"time"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

func GetDeviationValue(c *gin.Context) {
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(200, gin.H{"deviationValue": "10"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	collection := mongoClient.Database("admin").Collection("deviations")
	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
	filter := bson.M{"value": bson.M{"$exists": true}}
	var result bson.M
	err = collection.FindOne(ctx, filter).Decode(&result)
	if err != nil {
		c.JSON(200, gin.H{"deviationValue": "10"})
		return
	}
	c.JSON(200, gin.H{"deviationValue": result["value"].(string)})
}
