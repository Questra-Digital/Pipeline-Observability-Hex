// pipeline_name.go
package controller

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"log"
	"net/http"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"go.mongodb.org/mongo-driver/bson"
)

// GetAllPipelineData returns a slice of pipeline names or an error if token authentication fails.
func TokenAuth(token string) bool {

	// fetch thr url from mongoDB
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		log.Println("Error: ", err)
		return false
	}
	defer mongoClient.Disconnect(context.TODO())
	collection := mongoClient.Database("admin").Collection("argocd_api")
	var result bson.M
	err = collection.FindOne(context.TODO(), bson.D{}).Decode(&result)
	if err != nil {
		log.Println("Error: ", err)
		return false
	}
	url := result["argocdURL"].(string)
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
