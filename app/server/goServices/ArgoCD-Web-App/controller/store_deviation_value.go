package controller

import (
	"context"
	"fmt"
	"net/http"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
)

type Deviation struct {
	Value string `json:"value"`
}

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
