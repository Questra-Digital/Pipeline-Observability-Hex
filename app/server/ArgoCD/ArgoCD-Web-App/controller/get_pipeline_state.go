package controller

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
)

// Define a struct to store health statuses
type HealthSummary struct {
	Pod        string
	Service    string
	Deployment string
	ReplicaSet string
	Status     interface{}
}

type Message struct {
	Name string `json:"name"`
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// get all availble pipelines
func getAvailblePipelineMap() (map[string]int, error) {
	// Replace this with your actual implementation for retrieving pipeline names
	allPipeline, err := GetAllPipelineNames()
	if err != nil {
		fmt.Println("Token Error")
		return nil, err
	}

	// Initialize availablePipeline map
	availablePipeline := make(map[string]int)
	for _, pipeline := range allPipeline {
		availablePipeline[string(pipeline)] = 1
	}

	return availablePipeline, nil
}

func WriteJSONToWebSocket(conn *websocket.Conn, summary HealthSummary) error {
	jsonData, err := json.Marshal(summary)
	if err != nil {
		fmt.Println("Error encoding JSON:", err)
		return err
	}

	err = conn.WriteMessage(websocket.TextMessage, jsonData)
	if err != nil {
		fmt.Println(err)
		return err
	}

	return nil
}

func ReadMessageFromWebSocket(conn *websocket.Conn) (Message, error) {
	_, msg, err := conn.ReadMessage()
	if err != nil {
		fmt.Println(err)
		return Message{}, err
	}

	var receivedMsg Message
	err = json.Unmarshal(msg, &receivedMsg)
	if err != nil {
		fmt.Println("Error decoding JSON:", err)
		return Message{}, err
	}

	return receivedMsg, nil
}

// FetchPipelineData fetches data from the specified pipeline URL using the provided token.
func FetchPipelineData(pipelineName string) (map[string]interface{}, error) {
	// fetch the url from the database
	// Connect to the MongoDB
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		log.Println("Error: ", err)
		return nil, err
	}
	defer mongoClient.Disconnect(context.TODO())
	collection := mongoClient.Database("admin").Collection("argocd_api")
	var result bson.M
	err = collection.FindOne(context.TODO(), bson.D{}).Decode(&result)
	if err != nil {
		log.Println("Error: ", err)
		return nil, err
	}
	url := result["argocdURL"].(string) + "/" + pipelineName + "/resource-tree"
	// fmt.Printf("%v", url)

	// get the token from the database
	collection = mongoClient.Database("admin").Collection("argocdToken")
	err = collection.FindOne(context.TODO(), bson.M{}).Decode(&result)
	if err != nil {
		log.Println("Error: ", err)
		return nil, err
	}
	token := result["value"].(string)

	fmt.Println("Token: ", token)

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

func FetchPipelineMetrics(pipelineName string) (map[string]interface{}, error) {
	// fetch the url from the database
	// Connect to the MongoDB
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		log.Println("Error: ", err)
		return nil, err
	}
	defer mongoClient.Disconnect(context.TODO())
	collection := mongoClient.Database("admin").Collection("argocd_api")
	var result bson.M
	err = collection.FindOne(context.TODO(), bson.D{}).Decode(&result)
	if err != nil {
		log.Println("Error: ", err)
		return nil, err
	}
	url := result["argocdURL"].(string) + "/" + pipelineName
	// fmt.Printf("%v", url)

	// get the token from the database
	collection = mongoClient.Database("admin").Collection("argocdToken")
	err = collection.FindOne(context.TODO(), bson.M{}).Decode(&result)
	if err != nil {
		log.Println("Error: ", err)
		return nil, err
	}
	token := result["value"].(string)

	fmt.Println("Token: ", token)

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

// main function
func DataPipelineState(c *gin.Context) {

	err := godotenv.Load(".env")
	if err != nil {
		log.Fatalf("Error loading .env file")
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		fmt.Println(err)
		return
	}
	defer conn.Close()

	pipeline_name := "" // Default value if the parameter is not provided

	// get all availble pipelines map
	availble_pipeline, err := getAvailblePipelineMap()
	if err != nil {
		fmt.Println(err)
		return
	}

	go func() {
		for {
			_, isPipelineAvailble := availble_pipeline[string(pipeline_name)]
			if isPipelineAvailble {
				// get pipeline data
				responseData, err := FetchPipelineData(pipeline_name)
				if err != nil {
					fmt.Println(err)
					return
				}
				summary := ParsePipelineData(responseData["nodes"].([]interface{}))

				metrics, err := FetchPipelineMetrics(pipeline_name)
				if err != nil {
					fmt.Println(err)
					return
				}

				// summary.ProjectExecutions = len(metrics["status"].(map[string]interface{})["history"].([]interface{}))
				summary.Status = metrics["status"]

				// send summary to frontend
				err = WriteJSONToWebSocket(conn, summary)
				if err != nil {
					fmt.Println(err)
					return
				}
			}
			time.Sleep(5 * time.Second) // Send a message every 5 seconds
		}
	}()

	for {
		// Read message from the browser
		receivedMsg, err := ReadMessageFromWebSocket(conn)
		if err != nil {
			fmt.Println(err)
			return
		}
		// Check if the 'name' field is present
		if receivedMsg.Name != "" {
			pipeline_name = receivedMsg.Name
			fmt.Println("Pipeline Name:", pipeline_name)
		} else {
			fmt.Println("Error: 'Name' field not present in the received message")
			return
		}
	}
}
