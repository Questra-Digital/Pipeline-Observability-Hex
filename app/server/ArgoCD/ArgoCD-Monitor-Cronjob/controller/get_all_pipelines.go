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
	"os"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Monitor-Cronjob/mongoConnection"
	"github.com/joho/godotenv"
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
	for _, pipeline := range responseData["items"].([]interface{}) {
		pipelineData := pipeline.(map[string]interface{})
		metadata := pipelineData["metadata"].(map[string]interface{})
		name := metadata["name"].(string)

		fmt.Println("Name : ", name)
		pipelineNames = append(pipelineNames, name)
	}

	return pipelineNames, nil
}

// GetAllPipelineData returns a slice of pipeline names or an error if token authentication fails.
func GetAllPipelineNames() ([]string, error) {
	err := godotenv.Load(".env")

	if err != nil {
		log.Fatalf("Error loading .env file")
	}

	// fetch thr url from mongoDB
	// Connect to the MongoDB
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		log.Println("Error: ", err)
		return nil, err
	}
	defer mongoClient.Disconnect(context.TODO())
	collection := mongoClient.Database("admin").Collection("argocd_api")
	var result bson.M
	err = collection.FindOne(context.TODO(), bson.D{}).Decode(&result)
	if err != nil {
		log.Println("Error: ", err)
		return nil, err
	}
	url := result["argocdURL"].(string)

	// get the token from the .env
	token := os.Getenv("ARGOCD_TOKEN")

	// fmt.Println("Token: ", token)

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

	pipelineNames, err := parseJSONResponse(resp)
	return pipelineNames, err
}
