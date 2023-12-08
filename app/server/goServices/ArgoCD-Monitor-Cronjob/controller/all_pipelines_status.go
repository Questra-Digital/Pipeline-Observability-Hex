package controller

import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"sync"
)

var (
	counter     map[string]int
	counterLock sync.Mutex
)

// Define a struct to store health statuses
type HealthSummary struct {
	Pod        string
	Service    string
	Deployment string
	ReplicaSet string
}

// FetchPipelineData fetches data from the specified pipeline URL using the provided token.
func FetchPipelineData(pipelineName string) (map[string]interface{}, error) {
	url := fmt.Sprintf("https://127.0.0.1:8081/api/v1/applications/%s/resource-tree", pipelineName)
	// fmt.Printf("%v", url)

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

	// Read and parse the JSON response
	var responseData map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&responseData)
	if err != nil {
		return nil, err
	}

	return responseData, nil
}

// ParsePipelineData parses the pipeline data and updates the HealthSummary.
func ParsePipelineData(data []interface{}) HealthSummary {
	var summary HealthSummary

	for _, node := range data {
		nodeMap := node.(map[string]interface{})
		kind := nodeMap["kind"].(string)

		if kind == "EndpointSlice" || kind == "Endpoints" {
			continue
		}

		health, ok := nodeMap["health"].(map[string]interface{})
		if kind == "Pod" {
			name := nodeMap["networkingInfo"].(map[string]interface{})["labels"].(map[string]interface{})["app"].(string)
			fmt.Printf("Name : %s\n", name)
		}

		if ok {
			status := health["status"].(string)
			fmt.Printf("%s health status: %s\n", kind, status)

			switch kind {
			case "Pod":
				summary.Pod = status
			case "Service":
				summary.Service = status
			case "ReplicaSet":
				summary.ReplicaSet = status
			case "Deployment":
				summary.Deployment = status
			default:
			}
		}
	}

	return summary
}

// update the counter and send notification to slack
func updateCounter(isPipelineHealthy bool, pipeline_name string) {
	counterLock.Lock()
	defer counterLock.Unlock()

	if !isPipelineHealthy {
		counter[pipeline_name]++
		if counter[pipeline_name] == 2 {
			fmt.Println("Sending Slack Notification..........")
		}
	} else {
		counter[pipeline_name] = 0
	}
}

func processPipeline(pipeline_name string, wg *sync.WaitGroup) {
	defer wg.Done()

	responseData, err := FetchPipelineData(pipeline_name)
	if err != nil {
		fmt.Println(err)
		return
	}
	summary := ParsePipelineData(responseData["nodes"].([]interface{}))

	// checking health of all components of pipeline
	isPipelineHealthy := true
	checkHealth := func(component, status string) {
		if status != "Healthy" {
			fmt.Printf("%s : %s is not healthy\n", pipeline_name, component)
			isPipelineHealthy = false
		}
	}

	checkHealth("Pod", summary.Pod)
	checkHealth("Deployment", summary.Deployment)
	checkHealth("Service", summary.Service)
	checkHealth("ReplicaSet", summary.ReplicaSet)

	updateCounter(isPipelineHealthy, pipeline_name)
	fmt.Println(counter)
}

func AllPipelinesStatus() {
	// Initializing the global map if it is nil
	if counter == nil {
		counter = make(map[string]int)
	}

	allpipelines, err := GetAllPipelineNames()
	if err != nil {
		fmt.Println(err)
		return
	}

	var wg sync.WaitGroup

	for _, pipeline_name := range allpipelines {
		wg.Add(1)
		go processPipeline(pipeline_name, &wg)
	}

	wg.Wait()
}
