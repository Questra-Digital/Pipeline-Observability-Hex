package controller

import (
	"context"
	"fmt"
	"log"
	"net/http"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// IsPipelineAvailable checks if the requested pipeline is available
func IsPipelineAvailable(pipelineName string, c *gin.Context) bool {
	// Get all available pipelines
	availblePipelines, err := GetAllPipelineNames()
	if err != nil {
		fmt.Println("Token Error")
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

// FindPipelineHistory retrieves pipeline history documents from MongoDB
func findPipelineHistory(pipelineName string) ([]map[string]interface{}, error) {
	client, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		return nil, err
	}
	defer client.Disconnect(context.TODO())

	collection := client.Database("admin").Collection("argocd")

	filter := bson.M{"pipeline_name": pipelineName}
	options := options.Find().SetSort(bson.D{{Key: "time", Value: -1}})

	cursor, err := collection.Find(context.TODO(), filter, options)
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

	err := godotenv.Load(".env")
	if err != nil {
		log.Fatalf("Error loading .env file")
	}

	// Get the pipeline parameter from the query string
	pipelineName := c.Query("pipeline")

	// Check if the pipelineName is empty
	if pipelineName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Pipeline parameter is missing"})
		return
	}

	isPipelineAvailable := IsPipelineAvailable(pipelineName, c)
	if !isPipelineAvailable {
		c.JSON(http.StatusNoContent, gin.H{"message": "Requested pipeline is not available"})
		return
	}

	history, err := findPipelineHistory(pipelineName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error connecting to MongoDB"})
	}

	// Send the array of documents as a JSON response
	c.JSON(http.StatusOK, history)
}
