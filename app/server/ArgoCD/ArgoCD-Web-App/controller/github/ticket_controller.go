package github

import (
	"context"
	"net/http"
	"time"

	"github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller"
	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Ticket struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	RunID       int64              `bson:"runId" json:"runId"`
	RepoName    string             `bson:"repoName" json:"repoName"`
	RepoOwner   string             `bson:"repoOwner" json:"repoOwner"`
	IssueNumber int                `bson:"issueNumber" json:"issueNumber"`
	IssueURL    string             `bson:"issueUrl" json:"issueUrl"`
	Title       string             `bson:"title" json:"title"`
	Body        string             `bson:"body" json:"body"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
	Status      string             `bson:"status" json:"status"`
}

// GetTickets returns all automated GitHub issues from the database
func GetTickets(c *gin.Context) {
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
	defer mongoClient.Disconnect(context.TODO())

	db := mongoClient.Database("admin")
	issuesColl := db.Collection("github_issues")

	// Fetch all tickets, sorted by creation date (newest first)
	opts := options.Find().SetSort(bson.M{"createdAt": -1})
	cursor, err := issuesColl.Find(context.TODO(), bson.M{"status": bson.M{"$ne": "deleted"}}, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error fetching tickets"})
		return
	}
	defer cursor.Close(context.TODO())

	var tickets []Ticket
	if err = cursor.All(context.TODO(), &tickets); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error decoding tickets"})
		return
	}

	c.JSON(http.StatusOK, tickets)
}
