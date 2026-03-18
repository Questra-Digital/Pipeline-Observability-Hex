package controller

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Monitor-Cronjob/mongoConnection"
	"github.com/QuestraDigital/goServices/ArgoCD-Monitor-Cronjob/notificationClient"
	"github.com/go-redis/redis/v8"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
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
	REDIS_URL := os.Getenv("REDIS_URL")
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
}

// fetch all_pipeline names and then fetch the counter value from mongoDB and store it in Redis
func InitializePipelineCounter(userId string, argoURL string, argoToken string) {
	allpipelines, err := GetAllPipelineNames(argoURL, argoToken)
	if err != nil {
		fmt.Printf("Error getting pipelines for user %s: %v\n", userId, err)
		return
	}

	for _, pipeline_name := range allpipelines {
		// fetch the latest counter value from the db based on time and userId
		collection := mongoClient.Database("admin").Collection("pipelineCounter")
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		filter := bson.M{"pipeline_name": pipeline_name, "userId": userId}
		opts := options.FindOne().SetSort(bson.D{{Key: "time", Value: -1}})
		var result bson.M
		err := collection.FindOne(ctx, filter, opts).Decode(&result)
		if err != nil {
			continue
		}
		counter, ok := result["counter"]
		if !ok {
			continue
		}
		key := fmt.Sprintf("pipeline:%s:%s:counter", userId, pipeline_name)
		err = redisClient.Set(context.Background(), key, counter, 0).Err()
		if err != nil {
			fmt.Println("Error setting counter in redis:", err)
		}
	}
}

func GetDeviationValue(userId string) int {
	collection := mongoClient.Database("admin").Collection("deviations")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	filter := bson.M{"userId": userId}
	var result bson.M
	err := collection.FindOne(ctx, filter).Decode(&result)
	if err != nil {
		return 10
	}
	deviationValueSTR, ok := result["value"].(string)
	if !ok {
		return 10
	}
	deviationValueINT, err := strconv.Atoi(deviationValueSTR)
	if err != nil {
		return 10
	}
	return deviationValueINT
}

func InsertSummaryToMongoDB(pipelineName string, summary HealthSummary, userId string) error {
	collection := mongoClient.Database("admin").Collection("argocd")
	document := bson.M{
		"userId":        userId,
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
	return nil
}

// FetchPipelineData fetches data from the specified pipeline URL using the provided token.
func FetchPipelineData(pipelineName string, argoURL string, argoToken string) (map[string]interface{}, error) {
	url := argoURL + "/" + pipelineName + "/resource-tree"
	bearer := "Bearer " + argoToken

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

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ArgoCD API returned status: %d", resp.StatusCode)
	}

	var responseData map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&responseData)
	if err != nil {
		return nil, err
	}

	return responseData, nil
}

// ... existing ParsePipelineData function ...

// Store the Pipeline Nama and Counter Value in MongoDB just like Redis
func StorePipelineCounterInMongoDB(pipelineName string, counter int, userId string) error {
	collection := mongoClient.Database("admin").Collection("pipelineCounter")
	document := bson.M{
		"userId":        userId,
		"pipeline_name": pipelineName,
		"counter":       counter,
		"time":          time.Now(),
	}
	_, err := collection.InsertOne(context.TODO(), document)
	if err != nil {
		return err
	}
	return nil
}

// update the counter and send notification to slack
func updateCounter(isPipelineHealthy bool, pipelineName string, summary HealthSummary, userId string) {
	counterLock.Lock()
	defer counterLock.Unlock()

	key := fmt.Sprintf("pipeline:%s:%s:counter", userId, pipelineName)

	if !isPipelineHealthy {
		// insert the summary of pipeline in the db if the pipeline is not healthy
		err := InsertSummaryToMongoDB(pipelineName, summary, userId)
		if err != nil {
			fmt.Println(err)
			return
		}

		// Increment counter
		_, err = redisClient.Incr(context.Background(), key).Result()
		if err != nil {
			fmt.Println("Error incrementing counter:", err)
		}

		val, err := redisClient.Get(context.Background(), key).Int()
		if err != nil {
			fmt.Println("Error getting counter value:", err)
		}
		StorePipelineCounterInMongoDB(pipelineName, val, userId)

		// get the deviation value from the db
		deviationValue := GetDeviationValue(userId)

		if val == deviationValue {
			fmt.Println("Sending Notification for user: ", userId)
			// Get custom message for this user
			collection := mongoClient.Database("admin").Collection("custom_messages")
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			filter := bson.M{"userId": userId}
			var result bson.M
			err := collection.FindOne(ctx, filter).Decode(&result)
			message := "ArgoCD pipeline is out of sync!"
			if err == nil {
				message = result["value"].(string)
			}
			
			// We need a way to trigger notification for specific user's slack
			// For now, trigger generic but ideally, notificationClient should take userId
			notificationClient.TriggerNotificationService(message)
		}
	} else {
		val, _ := redisClient.Get(context.Background(), key).Int()
		if val > 0 {
			err := InsertSummaryToMongoDB(pipelineName, summary, userId)
			if err != nil {
				fmt.Println(err)
				return
			}
		}
		// Reset counter
		StorePipelineCounterInMongoDB(pipelineName, 0, userId)
		err := redisClient.Set(context.Background(), key, 0, 0).Err()
		if err != nil {
			fmt.Println("Error resetting counter:", err)
		}
	}
}

func processPipeline(pipeline_name string, userId string, argoURL string, argoToken string, wg *sync.WaitGroup) {
	defer wg.Done()

	responseData, err := FetchPipelineData(pipeline_name, argoURL, argoToken)
	if err != nil {
		return
	}
	summary := ParsePipelineData(responseData["nodes"].([]interface{}))

	// checking health of all components of pipeline
	isPipelineHealthy := true
	checkHealth := func(component, status string) {
		if status != "Healthy" {
			isPipelineHealthy = false
		}
	}

	checkHealth("Pod", summary.Pod)
	checkHealth("Deployment", summary.Deployment)
	checkHealth("Service", summary.Service)
	checkHealth("ReplicaSet", summary.ReplicaSet)

	updateCounter(isPipelineHealthy, pipeline_name, summary, userId)
}

func AllPipelinesStatus() {
	// 1. Fetch all users
	userColl := mongoClient.Database("admin").Collection("users")
	cursor, err := userColl.Find(context.TODO(), bson.M{})
	if err != nil {
		log.Println("Error fetching users: ", err)
		return
	}
	defer cursor.Close(context.TODO())

	var users []bson.M
	if err = cursor.All(context.TODO(), &users); err != nil {
		log.Println("Error decoding users: ", err)
		return
	}

	for _, user := range users {
		userEmail, ok := user["email"].(string)
		if !ok {
			continue
		}

		// 2. Fetch ArgoCD config for this user
		apiColl := mongoClient.Database("admin").Collection("argocd_api")
		tokenColl := mongoClient.Database("admin").Collection("argocdToken")
		
		var apiResult, tokenResult bson.M
		err1 := apiColl.FindOne(context.TODO(), bson.M{"userId": userEmail}).Decode(&apiResult)
		err2 := tokenColl.FindOne(context.TODO(), bson.M{"userId": userEmail}).Decode(&tokenResult)
		
		if err1 != nil || err2 != nil {
			// Skip user if config missing
			continue
		}

		argoURL := apiResult["argocdURL"].(string)
		argoToken := tokenResult["value"].(string)

		// 3. Process all pipelines for this user
		allpipelines, err := GetAllPipelineNames(argoURL, argoToken)
		if err != nil {
			fmt.Printf("Error getting pipelines for user %s: %v\n", userEmail, err)
			continue
		}

		var wg sync.WaitGroup
		for _, pipeline_name := range allpipelines {
			wg.Add(1)
			go processPipeline(pipeline_name, userEmail, argoURL, argoToken, &wg)
		}
		wg.Wait()
	}
}
