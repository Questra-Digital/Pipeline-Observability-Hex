// pipeline_name.go
package controller

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net/http"
)

// GetAllPipelineData returns a slice of pipeline names or an error if token authentication fails.
func GetAllPipelineNames() ([]string, error) {
	var pipelineNames []string

	url := "https://127.0.0.1:8081/api/v1/applications"
	token := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhcmdvY2QiLCJzdWIiOiJmeXA6YXBpS2V5IiwibmJmIjoxNjk4MTY3MTQ1LCJpYXQiOjE2OTgxNjcxNDUsImp0aSI6InRlc3QifQ.vS6v1SYzm6q5VYctDLTfyx6g1oLwoEjq-30BfrkxOBs" // Replace with your actual Bearer Token
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
