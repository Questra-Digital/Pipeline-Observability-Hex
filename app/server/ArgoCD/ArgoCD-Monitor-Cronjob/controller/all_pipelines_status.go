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
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	redisClient *redis.Client
	mongoClient *mongo.Client
)

type HealthSummary struct {
	Pod        string
	Service    string
	Deployment string
	ReplicaSet string
}

func init() {
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "localhost:6379"
	}
	redisClient = redis.NewClient(&redis.Options{
		Addr: redisURL,
		DB:   0,
	})

	var err error
	mongoClient, err = mongoconnection.ConnectToMongoDB()
	if err != nil {
		log.Printf("Error connecting to MongoDB: %v", err)
	}
}

func ctxTimeout() (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), 10*time.Second)
}

func GetDeviationValue(userId string) int {
	collection := mongoClient.Database("admin").Collection("deviations")
	ctx, cancel := ctxTimeout()
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

	ctx, cancel := ctxTimeout()
	defer cancel()
	_, err := collection.InsertOne(ctx, document)
	return err
}

func FetchPipelineData(pipelineName string, argoURL string, argoToken string) (map[string]interface{}, error) {
	url := argoURL + "/" + pipelineName + "/resource-tree"
	bearer := "Bearer " + argoToken

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

	var responseData map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&responseData)
	if err != nil {
		return nil, err
	}

	return responseData, nil
}

func ParsePipelineData(nodes []interface{}) HealthSummary {
	summary := HealthSummary{
		Pod:        "Healthy",
		Service:    "Healthy",
		Deployment: "Healthy",
		ReplicaSet: "Healthy",
	}

	for _, node := range nodes {
		n, ok := node.(map[string]interface{})
		if !ok {
			continue
		}
		kind, okK := n["kind"].(string)
		health, okH := n["health"].(map[string]interface{})
		if !okK || !okH {
			continue
		}
		status, okS := health["status"].(string)
		if !okS {
			continue
		}

		switch kind {
		case "Pod":
			if status != "Healthy" {
				summary.Pod = status
			}
		case "Service":
			if status != "Healthy" {
				summary.Service = status
			}
		case "Deployment":
			if status != "Healthy" {
				summary.Deployment = status
			}
		case "ReplicaSet":
			if status != "Healthy" {
				summary.ReplicaSet = status
			}
		}
	}
	return summary
}

func StorePipelineCounterInMongoDB(pipelineName string, counter int, userId string) error {
	collection := mongoClient.Database("admin").Collection("pipelineCounter")
	document := bson.M{
		"userId":        userId,
		"pipeline_name": pipelineName,
		"counter":       counter,
		"time":          time.Now(),
	}
	ctx, cancel := ctxTimeout()
	defer cancel()
	_, err := collection.InsertOne(ctx, document)
	return err
}

func updateCounter(isPipelineHealthy bool, pipelineName string, summary HealthSummary, userId string) {
	key := fmt.Sprintf("pipeline:%s:%s:counter", userId, pipelineName)

	if !isPipelineHealthy {
		err := InsertSummaryToMongoDB(pipelineName, summary, userId)
		if err != nil {
			log.Printf("Error inserting summary: %v", err)
			return
		}

		_, err = redisClient.Incr(context.Background(), key).Result()
		if err != nil {
			log.Printf("Error incrementing counter: %v", err)
		}

		val, err := redisClient.Get(context.Background(), key).Int()
		if err != nil {
			log.Printf("Error getting counter value: %v", err)
		}
		StorePipelineCounterInMongoDB(pipelineName, val, userId)

		deviationValue := GetDeviationValue(userId)

		if val == deviationValue {
			log.Printf("Sending Notification for user: %s", userId)
			collection := mongoClient.Database("admin").Collection("custom_messages")
			ctx, cancel := ctxTimeout()
			defer cancel()
			filter := bson.M{"userId": userId}
			var result bson.M
			err := collection.FindOne(ctx, filter).Decode(&result)
			message := "ArgoCD pipeline is out of sync!"
			if err == nil {
				if v, ok := result["value"].(string); ok {
					message = v
				}
			}

			notificationClient.TriggerNotificationService(message)
		}
	} else {
		val, _ := redisClient.Get(context.Background(), key).Int()
		if val > 0 {
			err := InsertSummaryToMongoDB(pipelineName, summary, userId)
			if err != nil {
				log.Printf("Error inserting summary: %v", err)
				return
			}
		}
		StorePipelineCounterInMongoDB(pipelineName, 0, userId)
		err := redisClient.Set(context.Background(), key, 0, 0).Err()
		if err != nil {
			log.Printf("Error resetting counter: %v", err)
		}
	}
}

func processPipeline(pipeline_name string, userId string, argoURL string, argoToken string, wg *sync.WaitGroup) {
	defer wg.Done()

	responseData, err := FetchPipelineData(pipeline_name, argoURL, argoToken)
	if err != nil {
		log.Printf("Error fetching pipeline data for %s: %v", pipeline_name, err)
		return
	}
	nodes, ok := responseData["nodes"].([]interface{})
	if !ok {
		log.Printf("Missing or invalid 'nodes' field for pipeline %s", pipeline_name)
		return
	}
	summary := ParsePipelineData(nodes)

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
	userColl := mongoClient.Database("admin").Collection("users")
	ctx, cancel := ctxTimeout()
	defer cancel()
	cursor, err := userColl.Find(ctx, bson.M{})
	if err != nil {
		log.Println("Error fetching users: ", err)
		return
	}
	defer cursor.Close(ctx)

	var users []bson.M
	if err = cursor.All(ctx, &users); err != nil {
		log.Println("Error decoding users: ", err)
		return
	}

	for _, user := range users {
		userEmail, ok := user["email"].(string)
		if !ok {
			continue
		}

		apiColl := mongoClient.Database("admin").Collection("argocd_api")
		tokenColl := mongoClient.Database("admin").Collection("argocdToken")

		var apiResult, tokenResult bson.M
		err1 := apiColl.FindOne(context.Background(), bson.M{"userId": userEmail}).Decode(&apiResult)
		err2 := tokenColl.FindOne(context.Background(), bson.M{"userId": userEmail}).Decode(&tokenResult)

		if err1 != nil || err2 != nil {
			continue
		}

		argoURL, okURL := apiResult["argocdURL"].(string)
		argoToken, okToken := tokenResult["value"].(string)
		if !okURL || !okToken {
			continue
		}

		allpipelines, err := GetAllPipelineNames(argoURL, argoToken)
		if err != nil {
			log.Printf("Error getting pipelines for user %s: %v", userEmail, err)
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
