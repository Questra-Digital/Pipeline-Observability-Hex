// pipeline_name.go
package controller

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"net/http"
	"log"
	"os"
	"github.com/joho/godotenv"
)

// GetAllPipelineData returns a slice of pipeline names or an error if token authentication fails.
func TokenAuth(token string) bool {
	err := godotenv.Load(".env")

	if err != nil {
	  log.Fatalf("Error loading .env file")
	}

	url := os.Getenv("ARGOCD_API")
	bearer := "Bearer " + token

	req, err := http.NewRequest("GET", url, bytes.NewBuffer(nil))
	if err != nil {
		return false
	}

	req.Header.Set("Authorization", bearer)
	req.Header.Add("Accept", "application/json")

	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Transport: tr}

	resp, err := client.Do(req)
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	// Check if the response status is not OK
	if resp.StatusCode != http.StatusOK {
		return false
	}

	// Read and parse the JSON response
	var responseData map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&responseData)
	return err == nil
}
