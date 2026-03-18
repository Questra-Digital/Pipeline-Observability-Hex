package argocdapi

import (
	"context"
	"net/http"

	"github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller"
	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type ArgoCDURL struct {
	UserID    string `bson:"userId" json:"userId"`
	ArgoCDURL string `bson:"argocdURL" json:"argocdURL"`
}

func StoreArgoCDAPI(c *gin.Context) {
	// Parse request body
	var argoCDURL map[string]string
	if err := c.BindJSON(&argoCDURL); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	argoCDURLValue := argoCDURL["argocdURL"]

	// Get user email
	userEmail := controller.GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// connect to MongoDB
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}
	defer mongoClient.Disconnect(context.Background())

	collection := mongoClient.Database("admin").Collection("argocd_api")

	// Update for specific user, or insert if not exists
	filter := bson.M{"userId": userEmail}
	update := bson.M{"$set": bson.M{"argocdURL": argoCDURLValue}}
	opts := options.Update().SetUpsert(true)

	_, err = collection.UpdateOne(context.Background(), filter, update, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store ArgoCD URL"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ArgoCD URL stored successfully"})
}

func GetArgoCDAPI(c *gin.Context) {
	// Get user email
	userEmail := controller.GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}
	defer mongoClient.Disconnect(context.Background())

	collection := mongoClient.Database("admin").Collection("argocd_api")
	var result bson.M
	err = collection.FindOne(context.Background(), bson.M{"userId": userEmail}).Decode(&result)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ArgoCD URL not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"argocdURL": result["argocdURL"]})
}
