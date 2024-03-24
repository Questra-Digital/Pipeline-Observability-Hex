package controller_test

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

// Mock HTTP server response with valid JSON data
func setupMockServer(jsonData []byte) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write(jsonData)
	}))
}

// Send HTTP GET request to the mock server
func sendHTTPRequest(url string, bearerToken string) (*http.Response, error) {
	client := &http.Client{
		Transport: &http.Transport{
			TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
		},
	}

	req, err := http.NewRequest("GET", url, bytes.NewBuffer(nil))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+bearerToken)
	req.Header.Add("Accept", "application/json")

	return client.Do(req)
}

// Parse JSON response and extract pipeline names
func parseJSONResponse(resp *http.Response) ([]string, error) {
	var pipelineNames []string

	var responseData map[string]interface{}
	err := json.NewDecoder(resp.Body).Decode(&responseData)
	if err != nil {
		return nil, err
	}

	for _, pipeline := range responseData["items"].([]interface{}) {
		pipelineData := pipeline.(map[string]interface{})
		metadata := pipelineData["metadata"].(map[string]interface{})
		name := metadata["name"].(string)
		pipelineNames = append(pipelineNames, name)
	}

	return pipelineNames, nil
}

// TestGetAllPipelineNames_Success tests the GetAllPipelineNames function
func TestGetAllPipelineNames_Success(t *testing.T) {
	// Expected pipeline names
	expectedNames := []string{"fyp-demo-app"}

	// Mock HTTP response with valid JSON data
	jsonData := []byte(`{ "items": [{"metadata": {"name": "fyp-demo-app"}}] }`)
	mockServer := setupMockServer(jsonData)
	defer mockServer.Close()

	// Send HTTP request to the mock server
	resp, err := sendHTTPRequest(mockServer.URL+"/api/v1/applications", "dummy-token")
	if err != nil {
		t.Fatalf("Error sending HTTP request: %v", err)
	}
	defer resp.Body.Close()

	// Parse
	pipelineNames, err := parseJSONResponse(resp)
	if err != nil {
		t.Fatalf("Error parsing JSON response: %v", err)
	}
	// Log the expected and actual pipeline names
	t.Logf("Expected pipeline names: %v", expectedNames)
	t.Logf("Actual pipeline names: %v", pipelineNames)

	// Assert expectations
	assert.NoError(t, err)
	assert.Equal(t, expectedNames, pipelineNames)

}
