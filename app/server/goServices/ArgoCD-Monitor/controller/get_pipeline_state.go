package controller

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net/http"
	mongoconnection "test-app/mongoConnection"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson"
)

// Define a struct to store health statuses
type HealthSummary struct {
	Pod        string
	Service    string
	Deployment string
	ReplicaSet string
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

func DataPipelineState(c *gin.Context) {

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		fmt.Println(err)
		return
	}
	defer conn.Close()

	pipeline_name := "" // Default value if the parameter is not provided
	all_pipeline, err := GetAllPipelineNames()
	if err != nil {
		// c.JSON(http.StatusUnauthorized, gin.H{"message": "Token error"})
		fmt.Println("Token Error")
		return
	}

	// Initialize availble_pipeline map
	availble_pipeline := make(map[string]int)
	for _, pipeline := range all_pipeline {
		availble_pipeline[string(pipeline)] = 1
	}
	go func() {
		for {
			_, isPipelineAvailble := availble_pipeline[string(pipeline_name)]

			if isPipelineAvailble {
				email := "ranaadil571@gmail.com"
				url := fmt.Sprintf("https://127.0.0.1:8081/api/v1/applications/%s/resource-tree", pipeline_name)
				token := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhcmdvY2QiLCJzdWIiOiJhZGlsMTphcGlLZXkiLCJuYmYiOjE2OTcyOTcwODEsImlhdCI6MTY5NzI5NzA4MSwianRpIjoiNDcyNDY3ZGEtN2Q3Yy00N2FhLWJkMTUtMjUyNzZmM2I1MjdmIn0.Yf1LfUDKQjrfG2boecd-6akAQP5bTNbzhL6o2F254HU" // Replace with your actual Bearer Token
				bearer := "Bearer " + token

				req, err := http.NewRequest("GET", url, bytes.NewBuffer(nil))
				if err != nil {
					// c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}

				req.Header.Set("Authorization", bearer)
				req.Header.Add("Accept", "application/json")

				tr := &http.Transport{
					TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
				}
				client := &http.Client{Transport: tr}

				resp, err := client.Do(req)
				if err != nil {
					// c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				defer resp.Body.Close()

				// mongo db connection
				mongoClient, err := mongoconnection.ConnectToMongoDB()
				if err != nil {
					// c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				defer mongoClient.Disconnect(context.TODO())

				// Read and parse the JSON response
				var responseData map[string]interface{}
				err = json.NewDecoder(resp.Body).Decode(&responseData)
				if err != nil {
					// c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				// fmt.Println(responseData["nodes"])
				var summary HealthSummary
				name := ""

				for _, node := range responseData["nodes"].([]interface{}) {
					nodeMap := node.(map[string]interface{})
					// Extract kind and health status
					kind := nodeMap["kind"].(string)
					if kind == "EndpointSlice" || kind == "Endpoints" {
						continue
					}

					health, ok := nodeMap["health"].(map[string]interface{})
					if kind == "Pod" {
						name = nodeMap["networkingInfo"].(map[string]interface{})["labels"].(map[string]interface{})["app"].(string)
						fmt.Printf("Name : %s\n", name)
					}
					// Check if "health" key is present
					if ok {
						status := health["status"].(string)
						fmt.Printf("%s health status: %s\n", kind, status)
						if name != pipeline_name {
							continue
						}
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
				// fmt.Println("Summary : ",summary)
				// insert in the db
				collection := mongoClient.Database("admin").Collection("argocd")
				document := bson.M{
					"email":         email,
					"pipeline_name": pipeline_name,
					"time":          time.Now(), // Add current time
					"summary": bson.M{
						"pod":        summary.Pod,
						"service":    summary.Service,
						"deployment": summary.Deployment,
						"replicaSet": summary.ReplicaSet,
					},
				}
				// Insert the document into MongoDB
				_, err = collection.InsertOne(context.TODO(), document)
				if err != nil {
					// c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
				fmt.Println("Inserted in MongoDB....")
				// Convert HealthSummary to JSON
				jsonData, err := json.Marshal(summary)
				if err != nil {
					fmt.Println("Error encoding JSON:", err)
					return
				}

				// Send JSON response to the client
				err = conn.WriteMessage(websocket.TextMessage, jsonData)
				if err != nil {
					fmt.Println(err)
					return
				}

				time.Sleep(5 * time.Second) // Send a message every 5 seconds
			}
		}
	}()

	for {
		// Read message from the browser
		_, msg, err := conn.ReadMessage()
		if err != nil {
			fmt.Println(err)
			return
		}

		var receivedMsg Message
		err = json.Unmarshal(msg, &receivedMsg)
		if err != nil {
			fmt.Println("Error decoding JSON:", err)
			return
		}

		// Check if the 'name' field is present
		if receivedMsg.Name != "" {
			// Access the name field
			pipeline_name = receivedMsg.Name
			fmt.Println("Pipeline Name:", pipeline_name)

			// Echo the message back to the browser
			err = conn.WriteMessage(websocket.TextMessage, msg)
			if err != nil {
				fmt.Println(err)
				return
			}
		} else {
			fmt.Println("Error: 'Name' field not present in the received message")
			return
		}
	}
}
