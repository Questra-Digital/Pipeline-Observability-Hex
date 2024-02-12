package controller

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"sync"
	"time"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Monitor-Cronjob/mongoConnection"
	"github.com/QuestraDigital/goServices/ArgoCD-Monitor-Cronjob/notificationClient"
	"github.com/go-redis/redis/v8"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

var (
	redisClient *redis.Client
	counterLock sync.Mutex
	mongoClient *mongo.Client
)

// Define a struct to store health statuses
type HealthSummary struct {
	Pod        string
	Service    string
	Deployment string
	ReplicaSet string
}

func init() {
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatalf("Error loading .env file")
	}
	REDIS_URL := os.Getenv("")
	// Initialize Redis client
	redisClient = redis.NewClient(&redis.Options{
		Addr: REDIS_URL, // Update with your Redis server address
		DB:   0,
	})

	// Initialize MongoDB client
	mongoClient, err = mongoconnection.ConnectToMongoDB()
	if err != nil {
		log.Fatalf("Error connecting to MongoDB: %v", err)
	}
	// defer mongoClient.Disconnect(context.TODO())

}

func GetDeviationValue() int {
	collection := mongoClient.Database("admin").Collection("deviations")
	ctx, _ := context.WithTimeout(context.Background(), 5*time.Second)
	filter := bson.M{"value": bson.M{"$exists": true}}
	var result bson.M
	err := collection.FindOne(ctx, filter).Decode(&result)
	if err != nil {
		fmt.Println("Error: ", err)
		return 10
	}
	deviationValueSTR, ok := result["value"].(string)
	if !ok {
		fmt.Println("Error: value is not a string")
		return 10
	}
	deviationValueINT, err := strconv.Atoi(deviationValueSTR)
	if err != nil {
		fmt.Println("Error: ", err)
		return 10
	}
	return deviationValueINT
}

func InsertSummaryToMongoDB(pipelineName string, summary HealthSummary) error {
	collection := mongoClient.Database("admin").Collection("argocd")
	document := bson.M{
		"pipeline_name": pipelineName,
		"time":          time.Now(),
		"summary": bson.M{
			"pod":        summary.Pod,
			"service":    summary.Service,
			"deployment": summary.Deployment,
			"replicaSet": summary.ReplicaSet,
		},
	}

	_, err := collection.InsertOne(context.TODO(), document)
	if err != nil {
		return err
	}
	fmt.Println("Inserted in MongoDB....")
	return nil
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
func updateCounter(isPipelineHealthy bool, pipelineName string, summary HealthSummary) {
	counterLock.Lock()
	defer counterLock.Unlock()

	key := fmt.Sprintf("pipeline:%s:counter", pipelineName)

	if !isPipelineHealthy {
		// insert the summary of pipeline in the db if the pipeline is not healthy
		err := InsertSummaryToMongoDB(pipelineName, summary)
		if err != nil {
			// c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			fmt.Println(err)
			return
		}

		// Increment counter
		_, err = redisClient.Incr(context.Background(), key).Result()
		if err != nil {
			fmt.Println("Error incrementing counter:", err)
		}

		// Check if the counter is 2
		val, err := redisClient.Get(context.Background(), key).Int()
		if err != nil {
			fmt.Println("Error getting counter value:", err)
		}

		// get the deviation value from the db
		deviationValue := GetDeviationValue()

		if val == deviationValue {
			fmt.Println("Sending Slack Notification..........")
			// Add your Slack notification logic here
			notificationClient.TriggerNotificationService()
		}
	} else {
		// Check if the counter is 10
		val, err := redisClient.Get(context.Background(), key).Int()
		if err != nil {
			fmt.Println("Error getting counter value:", err)
		}
		if val > 0 {
			// insert the summary of pipeline in the db if the pipeline is not healthy
			err = InsertSummaryToMongoDB(pipelineName, summary)
			if err != nil {
				// c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				fmt.Println(err)
				return
			}
		}
		// Reset counter
		err = redisClient.Set(context.Background(), key, 0, 0).Err()
		if err != nil {
			fmt.Println("Error resetting counter:", err)
		}
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

	updateCounter(isPipelineHealthy, pipeline_name, summary)
}

func AllPipelinesStatus() {
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
