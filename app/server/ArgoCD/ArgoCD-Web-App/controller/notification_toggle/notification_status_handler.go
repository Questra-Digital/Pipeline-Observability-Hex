package notificationtoggle

import (
	"context"
	"log"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func ReadNotificationStatus(c *gin.Context, notificationType string) {
	// connect to the MongoDB
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		log.Println("Error: ", err)
		c.JSON(500, gin.H{"error": "Internal server error"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())
	// get the collection
	collection := mongoClient.Database("notification").Collection(notificationType)
	// find the notification status
	var result bson.M
	err = collection.FindOne(context.TODO(), bson.D{{Key: "name", Value: notificationType}}).Decode(&result)
	if err != nil {
		log.Println("Error: ", err)
		c.JSON(500, gin.H{"error": "Internal server error"})
		return
	}
	// return the notification status
	c.JSON(200, gin.H{"status": result["status"]})
}

func UpdateNotificationStatus(c *gin.Context, notificationType string) {
	// Parse request body
	var requestBody map[string]string
	if err := c.BindJSON(&requestBody); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request body"})
		return
	}
	// get the status value
	status := requestBody["status"]
	// connect to the MongoDB
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		log.Println("Error: ", err)
		c.JSON(500, gin.H{"error": "Internal server error"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())
	// get the collection
	collection := mongoClient.Database("notification").Collection(notificationType)
	// update the notification status and insert if not exists
	_, err = collection.UpdateOne(
		context.TODO(),
		bson.M{"name": notificationType},
		bson.M{"$set": bson.M{"status": status}},
		options.Update().SetUpsert(true), // Add a comma here
	)
	if err != nil {
		log.Println("Error: ", err)
		c.JSON(500, gin.H{"error": "Internal server error"})
		return
	}
	c.JSON(200, gin.H{"message": notificationType + " notification status updated successfully"})
}
