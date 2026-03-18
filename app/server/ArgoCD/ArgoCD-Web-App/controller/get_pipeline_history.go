package controller

import (
	"context"
	"fmt"
	"net/http"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// IsPipelineAvailable checks if the requested pipeline is available for the given user
func IsPipelineAvailable(pipelineName string, userId string) bool {
	// Get all available pipelines for this user
	availblePipelines, err := GetAllPipelineNames(userId)
	if err != nil {
		fmt.Println("Error fetching pipeline names for availability check: ", err)
		return false
	}

	// Check if the requested pipeline is in the list
	_isPipelineAvailable := false
	for _, availablePipeline := range availblePipelines {
		if availablePipeline == pipelineName {
			_isPipelineAvailable = true
			break
		}
	}
	return _isPipelineAvailable
}

// findPipelineHistory retrieves pipeline history documents from MongoDB for a specific user
func findPipelineHistory(pipelineName string, userId string) ([]map[string]interface{}, error) {
	client, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		return nil, err
	}
	defer client.Disconnect(context.TODO())

	collection := client.Database("admin").Collection("argocd")

	filter := bson.M{"pipeline_name": pipelineName, "userId": userId}
	opts := options.Find().SetSort(bson.D{{Key: "time", Value: -1}})

	cursor, err := collection.Find(context.TODO(), filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO())

	var documents []map[string]interface{}
	for cursor.Next(context.TODO()) {
		var document map[string]interface{}
		err := cursor.Decode(&document)
		if err != nil {
			fmt.Println("Error During Finding Document")
			return nil, err
		}
		documents = append(documents, document)
	}

	return documents, nil
}

func PipelineHistory(c *gin.Context) {
	userEmail := GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get the pipeline parameter from the query string
	pipelineName := c.Query("pipeline")

	// Check if the pipelineName is empty
	if pipelineName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Pipeline parameter is missing"})
		return
	}

	isPipelineAvailable := IsPipelineAvailable(pipelineName, userEmail)
	if !isPipelineAvailable {
		c.JSON(http.StatusNoContent, gin.H{"message": "Requested pipeline is not available"})
		return
	}

	history, err := findPipelineHistory(pipelineName, userEmail)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching history from MongoDB"})
		return
	}

	// Send the array of documents as a JSON response
	c.JSON(http.StatusOK, history)
}
