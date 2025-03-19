package controller

import (
	"context"
	"fmt"
	"net/http"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
)

type CustomMessage struct {
	Value string `json:"value"`
}

func StoreCustomMessage(c *gin.Context, custom_message string) {
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		fmt.Println("Error: ", err)
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	collection := mongoClient.Database("admin").Collection("custom_messages")

	// Drop the collection
	err = collection.Drop(context.TODO())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	message := CustomMessage{Value: custom_message}

	// Insert the new value
	insertResult, err := collection.InsertOne(context.TODO(), message)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Custom Message inserted....", "insertedID": insertResult.InsertedID})
}
