package controller_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func setupMockServer(jsonData []byte) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write(jsonData)
	}))
}

func sendHTTPRequest(url string, bearerToken string) (*http.Response, error) {
	client := &http.Client{}

	req, err := http.NewRequest("GET", url, bytes.NewBuffer(nil))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+bearerToken)
	req.Header.Add("Accept", "application/json")

	return client.Do(req)
}

func parseJSONResponse(resp *http.Response) ([]string, error) {
	var pipelineNames []string

	var responseData map[string]interface{}
	err := json.NewDecoder(resp.Body).Decode(&responseData)
	if err != nil {
		return nil, err
	}

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

func TestGetAllPipelineNames_Success(t *testing.T) {
	expectedNames := []string{"fyp-demo-app"}

	jsonData := []byte(`{ "items": [{"metadata": {"name": "fyp-demo-app"}}] }`)
	mockServer := setupMockServer(jsonData)
	defer mockServer.Close()

	resp, err := sendHTTPRequest(mockServer.URL+"/api/v1/applications", "dummy-token")
	if err != nil {
		t.Fatalf("Error sending HTTP request: %v", err)
	}
	defer resp.Body.Close()

	pipelineNames, err := parseJSONResponse(resp)
	if err != nil {
		t.Fatalf("Error parsing JSON response: %v", err)
	}

	assert.Equal(t, expectedNames, pipelineNames)
}

func TestParseJSONResponse_MalformedData(t *testing.T) {
	jsonData := []byte(`{ "items": "not-an-array" }`)
	mockServer := setupMockServer(jsonData)
	defer mockServer.Close()

	resp, err := sendHTTPRequest(mockServer.URL, "token")
	if err != nil {
		t.Fatalf("Error: %v", err)
	}
	defer resp.Body.Close()

	names, err := parseJSONResponse(resp)
	assert.NoError(t, err)
	assert.Empty(t, names)
}

func TestParseJSONResponse_EmptyItems(t *testing.T) {
	jsonData := []byte(`{ "items": [] }`)
	mockServer := setupMockServer(jsonData)
	defer mockServer.Close()

	resp, err := sendHTTPRequest(mockServer.URL, "token")
	if err != nil {
		t.Fatalf("Error: %v", err)
	}
	defer resp.Body.Close()

	names, err := parseJSONResponse(resp)
	assert.NoError(t, err)
	assert.Empty(t, names)
}

func TestGetAllPipelines_NonOKStatus(t *testing.T) {
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
	}))
	defer mockServer.Close()

	client := &http.Client{}
	req, _ := http.NewRequest("GET", mockServer.URL, bytes.NewBuffer(nil))
	req.Header.Set("Authorization", "Bearer token")

	resp, _ := client.Do(req)
	assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
}
