package controller

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net/http"
	mongoconnection "test-app/mongoConnection"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

// Define a struct to store health statuses
type HealthSummary struct {
	Pod        string
	Service    string
	Deployment string
	ReplicaSet string
}

func DataPipelineState(c *gin.Context) {
	pipeline_name := c.DefaultQuery("pipeline", "") // Default value if the parameter is not provided
	availble_pipeline, err := GetAllPipelineNames()
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Token error"})
		return
	}

	isPipelineAvailble := false
	for _, current_pipeline := range availble_pipeline {
		if current_pipeline == pipeline_name {
			isPipelineAvailble = true
			break
		}
	}
	if !isPipelineAvailble {
		c.JSON(http.StatusOK, gin.H{"message": "Pipeline is currently unavailable..."})
		return
	}
	email := "ranaadil571@gmail.com"

	url := fmt.Sprintf("https://127.0.0.1:8081/api/v1/applications/%s/resource-tree", pipeline_name)
	token := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhcmdvY2QiLCJzdWIiOiJmeXA6YXBpS2V5IiwibmJmIjoxNjk4MTY3MTQ1LCJpYXQiOjE2OTgxNjcxNDUsImp0aSI6InRlc3QifQ.vS6v1SYzm6q5VYctDLTfyx6g1oLwoEjq-30BfrkxOBs" // Replace with your actual Bearer Token
	bearer := "Bearer " + token

	req, err := http.NewRequest("GET", url, bytes.NewBuffer(nil))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	req.Header.Set("Authorization", bearer)
	req.Header.Add("Accept", "application/json")

	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Transport: tr}

	resp, err := client.Do(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer resp.Body.Close()

	// mongo db connection
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	// Read and parse the JSON response
	var responseData map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&responseData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// fmt.Println(responseData["nodes"])
	var summary HealthSummary
	name := ""

	for _, node := range responseData["nodes"].([]interface{}) {
		nodeMap := node.(map[string]interface{})
		// Extract kind and health status
		kind := nodeMap["kind"].(string)
		if kind == "EndpointSlice" || kind == "Endpoints" {
			continue
		}

		health, ok := nodeMap["health"].(map[string]interface{})
		if kind == "Pod" {
			name = nodeMap["networkingInfo"].(map[string]interface{})["labels"].(map[string]interface{})["app"].(string)
			fmt.Printf("Name : %s\n", name)
		}
		// Check if "health" key is present
		if ok {
			status := health["status"].(string)
			fmt.Printf("%s health status: %s\n", kind, status)
			if name != pipeline_name {
				continue
			}
			switch kind {
			case "Pod":
				summary.Pod = status
			case "Service":
				summary.Service = status
			case "ReplicaSet":
				summary.ReplicaSet = status
			case "Deployment":
				summary.Deployment = status
			default:
			}
		}
	}
	// fmt.Println("Summary : ",summary)
	// insert in the db
	collection := mongoClient.Database("admin").Collection("argocd")
	document := bson.M{
		"email":         email,
		"pipeline_name": pipeline_name,
		"time":          time.Now(), // Add current time
		"summary": bson.M{
			"pod":        summary.Pod,
			"service":    summary.Service,
			"deployment": summary.Deployment,
			"replicaSet": summary.ReplicaSet,
		},
	}
	// Insert the document into MongoDB
	_, err = collection.InsertOne(context.TODO(), document)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	fmt.Println("Inserted....")
	// Display the JSON data in the response
	c.JSON(http.StatusOK, gin.H{"data": responseData})
}
