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
func GetAllPipelineNames(url string, token string) ([]string, error) {
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
