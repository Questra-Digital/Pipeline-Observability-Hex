package controller

import (
	"fmt"
	"sync"
)

var (
	counter     map[string]int
	counterLock sync.Mutex
)

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
