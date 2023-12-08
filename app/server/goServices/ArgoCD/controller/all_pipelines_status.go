package controller

import "fmt"

var counter map[string]int

// update the counter and send notification to slack
func updateCounter(isPipelineHealthy bool, pipeline_name string) {
	if !isPipelineHealthy {
		counter[pipeline_name]++
		if counter[pipeline_name] == 2 {
			fmt.Println("Sending Slack Notification..........")
		}
	} else {
		counter[pipeline_name] = 0
	}
}

func AllPipelinesStatus() {
	// Initializing the global map if it is nil
	if counter == nil {
		counter = make(map[string]int)
	}

	allpipelines, err := GetAllPipelineNames()
	if err != nil {
		fmt.Println(err)
	}
	for _, pipeline_name := range allpipelines {
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
}
