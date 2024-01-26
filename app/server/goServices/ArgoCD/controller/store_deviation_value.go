package controller

import (
	"context"
	"fmt"
	"net/http"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD/mongoConnection"
	"github.com/gin-gonic/gin"
)

type Deviation struct {
	Value string `json:"value"`
}

// func GetDeviationValue(collection *mongo.Collection, key string) {
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
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		fmt.Println("Error: ", err)
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	collection := mongoClient.Database("admin").Collection("deviations")

	// Drop the collection
	err = collection.Drop(context.TODO())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Use deviation_value directly
	deviation := Deviation{Value: deviation_value}

	// Insert the new value
	insertResult, err := collection.InsertOne(context.TODO(), deviation)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deviation Value inserted....", "insertedID": insertResult.InsertedID})
}
