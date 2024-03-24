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

func TokenAuth(token string) bool {

	url := "https://127.0.0.1:8081/api/v1/applications"
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

func TestTokenAuth_Success(t *testing.T) {
	// Mock HTTP response with a valid JSON
	jsonData := []byte(`{ "some_key": "some_value" }`)
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write(jsonData)
	}))
	defer mockServer.Close()

	// Call the function under test with a valid token
	token := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhcmdvY2QiLCJzdWIiOiJhZGlsMTphcGlLZXkiLCJuYmYiOjE3MTA3NDk3NzUsImlhdCI6MTcxMDc0OTc3NSwianRpIjoidGVzdCJ9.fpkDqCcLLupxBbxzbyD9U1hdteC1o_KcbT1zF4J7SoA"
	result := TokenAuth(token)

	// Assert that the result is true (authentication successful)
	assert.True(t, result)
}

func TestTokenAuth_Failure(t *testing.T) {
	// Mock HTTP response with a non-OK status code
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
	}))
	defer mockServer.Close()

	// Call the function under test with an invalid token
	token := "invalid_token"
	result := TokenAuth(token)

	// Assert that the result is false (authentication failed)
	assert.False(t, result)
}
