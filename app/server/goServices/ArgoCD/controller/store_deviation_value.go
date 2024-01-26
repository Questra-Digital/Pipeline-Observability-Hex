package controller

import (
	"context"
	"fmt"
	"net/http"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD/mongoConnection"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Deviation struct {
	Value string `json:"value"`
}

var collection *mongo.Collection

func init() {
	client, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		fmt.Println("Error while connecting to MongoDB: %v", err)
		return
	}
	collection = client.Database("admin").Collection("deviations")
}

// func GetDeviationValue(key string) {
// 	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
// 	filter := bson.M{key: bson.M{"$exists": true}}
// 	var result bson.M
// 	err := collection.FindOne(ctx, filter).Decode(&result)
// 	if err != nil {
// 		fmt.Println("Error: ", err)
// 		return
// 	}
// 	fmt.Println("Old Value: ", result[key])
// }

func StoreDeviationValue(c *gin.Context, deviation_value string) {
	// Parse JSON request body
	deviation := Deviation{Value: deviation_value}

	if err := c.ShouldBindJSON(&deviation); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Define a filter based on the Name field
	filter := bson.M{"value": deviation.Value}

	// Define an update document
	update := bson.M{"$set": bson.M{"value": deviation.Value}}

	// Set the upsert option to true
	upsert := true

	// Perform the upsert operation
	result, err := collection.UpdateOne(context.TODO(), filter, update, &options.UpdateOptions{
		Upsert: &upsert,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Document upserted", "matchedCount": result.MatchedCount, "modifiedCount": result.ModifiedCount, "upsertedID": result.UpsertedID})
}
