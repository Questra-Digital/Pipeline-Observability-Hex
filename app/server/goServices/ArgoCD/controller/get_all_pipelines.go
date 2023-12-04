// pipeline_name.go
package controller

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

// GetAllPipelineData returns a slice of pipeline names or an error if token authentication fails.
func GetAllPipelineNames() ([]string, error) {
	var pipelineNames []string

	err := godotenv.Load(".env")

	if err != nil {
		log.Fatalf("Error loading .env file")
	}

	url := os.Getenv("ARGOCD_API")
	token := os.Getenv("ARGOCD_TOKEN")
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

	// Check if the response status is not OK
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("token error, status code: %d", resp.StatusCode)
	}

	// Read and parse the JSON response
	var responseData map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&responseData)
	if err != nil {
		return nil, err
	}

	for _, pipeline := range responseData["items"].([]interface{}) {
		pipelineData := pipeline.(map[string]interface{})
		metadata := pipelineData["metadata"].(map[string]interface{})
		fmt.Println("Name : ", metadata["name"].(string))
		pipelineNames = append(pipelineNames, metadata["name"].(string))
	}
	return pipelineNames, nil
}
