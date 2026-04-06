// pipeline_name.go
package controller

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

// this function parse the Json reponse and returns the availble pipelines
func parseJSONResponse(resp *http.Response) ([]string, error) {
	var pipelineNames []string

	// Read and parse the JSON response
	var responseData map[string]interface{}
	err := json.NewDecoder(resp.Body).Decode(&responseData)
	if err != nil {
		return nil, err
	}

	// Extract pipeline names from the response
	items, ok := responseData["items"].([]interface{})
	if !ok {
		return pipelineNames, nil
	}
	for _, pipeline := range items {
		pipelineData, ok := pipeline.(map[string]interface{})
		if !ok {
			continue
		}
		metadata, ok := pipelineData["metadata"].(map[string]interface{})
		if !ok {
			continue
		}
		name, ok := metadata["name"].(string)
		if !ok {
			continue
		}
		pipelineNames = append(pipelineNames, name)
	}

	return pipelineNames, nil
}

// GetAllPipelineNames returns a slice of pipeline names or an error if token authentication fails.
func GetAllPipelineNames(userId string) ([]string, error) {
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		log.Println("Error: ", err)
		return nil, err
	}
	defer mongoClient.Disconnect(context.TODO())

	filter := bson.M{"userId": userId}

	collection := mongoClient.Database("admin").Collection("argocd_api")
	var result bson.M
	err = collection.FindOne(context.TODO(), filter).Decode(&result)
	if err != nil {
		log.Println("Error fetching ArgoCD URL: ", err)
		return nil, err
	}
	url := result["argocdURL"].(string)

	// get the token from the database
	collection = mongoClient.Database("admin").Collection("argocdToken")
	err = collection.FindOne(context.TODO(), filter).Decode(&result)
	if err != nil {
		log.Println("Error fetching ArgoCD Token: ", err)
		return nil, err
	}
	token := result["value"].(string)

	bearer := "Bearer " + token

	req, err := http.NewRequest("GET", url, bytes.NewBuffer(nil))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", bearer)
	req.Header.Add("Accept", "application/json")

	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Transport: tr}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ArgoCD API returned status: %d", resp.StatusCode)
	}

	pipelineNames, err := parseJSONResponse(resp)
	return pipelineNames, err
}

// GetAllPipelines is the Gin handler for GET /all_pipelines.
// It returns the list of ArgoCD application names for the authenticated user.
func GetAllPipelines(c *gin.Context) {
	userEmail := GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	pipelineNames, err := GetAllPipelineNames(userEmail)
	if err != nil {
		log.Printf("[GetAllPipelines] Error for user %s: %v\n", userEmail, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":              "Failed to fetch ArgoCD pipelines",
			"available_pipeline": []string{},
		})
		return
	}

	if pipelineNames == nil {
		pipelineNames = []string{}
	}

	c.JSON(http.StatusOK, gin.H{
		"available_pipeline": pipelineNames,
	})
}
