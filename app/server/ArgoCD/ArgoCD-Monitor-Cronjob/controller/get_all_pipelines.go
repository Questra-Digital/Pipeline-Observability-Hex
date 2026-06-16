package controller

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

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

func GetAllPipelineNames(url string, token string) ([]string, error) {
	bearer := "Bearer " + token

	req, err := http.NewRequest("GET", url, bytes.NewBuffer(nil))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", bearer)
	req.Header.Add("Accept", "application/json")

	skipVerify := os.Getenv("TLS_SKIP_VERIFY") == "true"
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: skipVerify},
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

	return parseJSONResponse(resp)
}
