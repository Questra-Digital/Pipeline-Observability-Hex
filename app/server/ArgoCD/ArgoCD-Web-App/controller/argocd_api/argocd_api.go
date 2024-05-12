package argocdapi

import (
	"context"
	"fmt"
	"net/http"

	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
)

func StoreArgoCDAPI(c *gin.Context) {
	// we have only argocd url
	var argoCDURL map[string]string
	if err := c.BindJSON(&argoCDURL); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	argoCDURLValue := argoCDURL["argocdURL"]
	fmt.Println("ArgoCD URL: ", argoCDURLValue)
	// connect to MongoDB
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer mongoClient.Disconnect(context.Background())
	collection := mongoClient.Database("admin").Collection("argocd_api")
	// delete existing argocd url
	_, err = collection.DeleteMany(context.Background(), bson.D{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// store argocd url in MongoDB
	_, err = collection.InsertOne(context.Background(), bson.D{
		{Key: "argocdURL", Value: argoCDURLValue},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ArgoCD URL stored successfully"})
}

func GetArgoCDAPI(c *gin.Context) {
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer mongoClient.Disconnect(context.Background())
	collection := mongoClient.Database("admin").Collection("argocd_api")
	var result bson.M
	err = collection.FindOne(context.Background(), bson.D{}).Decode(&result)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"argocdURL": result["argocdURL"]})
}
