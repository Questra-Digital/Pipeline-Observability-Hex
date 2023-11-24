package controller

import (
	"context"
	"net/http"
	"os"
	"log"
	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD/mongoConnection"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
	"github.com/joho/godotenv"
)

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

	// Get all available pipelines
	availblePipelines, err := GetAllPipelineNames()
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Token error"})
		return
	}

	// Check if the requested pipeline is in the list
	isPipelineAvailable := false
	for _, availablePipeline := range availblePipelines {
		if availablePipeline == pipelineName {
			isPipelineAvailable = true
			break
		}
	}

	if !isPipelineAvailable {
		c.JSON(http.StatusNoContent, gin.H{"message": "Requested pipeline is not available"})
		return
	}

	// Get the email from the authentication or wherever you have it
	email := os.Getenv("USER_EMAIL")

	// MongoDB connection
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error connecting to MongoDB"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	// Get a handle to the database and collection
	collection := mongoClient.Database("admin").Collection("argocd")

	// Filter to find all documents for the given pipeline and email
	filter := bson.M{"email": email, "pipeline_name": pipelineName}

	// Options to sort by time in descending order
	options := options.Find().SetSort(bson.D{{Key: "time", Value: -1}})

	// Find all documents
	cursor, err := collection.Find(context.TODO(), filter, options)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error finding documents"})
		return
	}
	defer cursor.Close(context.TODO())

	// Decode the cursor into an array of maps
	var documents []map[string]interface{}
	for cursor.Next(context.TODO()) {
		var document map[string]interface{}
		err := cursor.Decode(&document)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error decoding document"})
			return
		}
		documents = append(documents, document)
	}

	// Send the array of documents as a JSON response
	c.JSON(http.StatusOK, documents)
}
