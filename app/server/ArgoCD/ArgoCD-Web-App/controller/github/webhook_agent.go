package github

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller"
	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// WebhookConfig stores a user-defined outbound webhook endpoint.
type WebhookConfig struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"  json:"id"`
	UserID    string             `bson:"userId"         json:"userId"`
	Label     string             `bson:"label"          json:"label"`
	URL       string             `bson:"url"            json:"url"`
	// Events the webhook listens for: "failure", "success", "all"
	Events    []string           `bson:"events"         json:"events"`
	// Format: "slack" or "generic"
	Format    string             `bson:"format"         json:"format"`
	Active    bool               `bson:"active"         json:"active"`
	CreatedAt time.Time          `bson:"createdAt"      json:"createdAt"`
}

// CreateWebhookRequest is the body for POST /api/github/webhooks.
type CreateWebhookRequest struct {
	Label  string   `json:"label"  binding:"required"`
	URL    string   `json:"url"    binding:"required"`
	Events []string `json:"events"`
	Format string   `json:"format"`
}

// CreateWebhook registers a new outbound webhook.
// POST /api/github/webhooks
func CreateWebhook(c *gin.Context) {
	userEmail := controller.GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req CreateWebhookRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if req.Format == "" {
		req.Format = "generic"
	}
	if len(req.Events) == 0 {
		req.Events = []string{"failure"}
	}

	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	cfg := WebhookConfig{
		ID:        primitive.NewObjectID(),
		UserID:    userEmail,
		Label:     req.Label,
		URL:       req.URL,
		Events:    req.Events,
		Format:    req.Format,
		Active:    true,
		CreatedAt: time.Now(),
	}

	_, err = mongoClient.Database("admin").Collection("github_webhook_configs").InsertOne(context.TODO(), cfg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save webhook config"})
		return
	}

	c.JSON(http.StatusOK, cfg)
}

// GetWebhooks returns all webhook configs for the authenticated user.
// GET /api/github/webhooks
func GetWebhooks(c *gin.Context) {
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

	cursor, err := mongoClient.Database("admin").Collection("github_webhook_configs").
		Find(context.TODO(), bson.M{"userId": userEmail},
			options.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}}))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch webhooks"})
		return
	}
	var configs []WebhookConfig
	if err = cursor.All(context.TODO(), &configs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error decoding webhooks"})
		return
	}
	if configs == nil {
		configs = []WebhookConfig{}
	}
	c.JSON(http.StatusOK, configs)
}

// DeleteWebhook removes a webhook config by ID.
// DELETE /api/github/webhooks/:id
func DeleteWebhook(c *gin.Context) {
	userEmail := controller.GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	objID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid webhook ID"})
		return
	}

	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	res, err := mongoClient.Database("admin").Collection("github_webhook_configs").
		DeleteOne(context.TODO(), bson.M{"_id": objID, "userId": userEmail})
	if err != nil || res.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Webhook not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Webhook deleted"})
}

// TestWebhook sends a test payload to a webhook URL to verify connectivity.
// POST /api/github/webhooks/:id/test
func TestWebhook(c *gin.Context) {
	userEmail := controller.GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	objID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid webhook ID"})
		return
	}

	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	var cfg WebhookConfig
	if err := mongoClient.Database("admin").Collection("github_webhook_configs").
		FindOne(context.TODO(), bson.M{"_id": objID, "userId": userEmail}).
		Decode(&cfg); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Webhook config not found"})
		return
	}

	payload := buildWebhookPayload(cfg.Format, &WebhookEvent{
		EventType:    "test",
		Repo:         "vizops/test-repo",
		WorkflowName: "Test Workflow",
		RunID:        0,
		Conclusion:   "failure",
		RunURL:       "https://github.com",
		Message:      "This is a test notification from VizOps Neural Intelligence Hub.",
		Severity:     "test",
	})

	status, deliveryErr := deliverWebhook(cfg.URL, payload)
	if deliveryErr != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": fmt.Sprintf("Webhook delivery failed (HTTP %d): %v", status, deliveryErr)})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Test payload delivered (HTTP %d)", status)})
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal delivery helpers (used by the sync service via shared logic)
// ─────────────────────────────────────────────────────────────────────────────

// WebhookEvent is the internal event model used when building notification payloads.
type WebhookEvent struct {
	EventType    string // "failure", "success", "escalation"
	Repo         string
	WorkflowName string
	RunID        int64
	Conclusion   string
	RunURL       string
	Message      string
	Severity     string // "critical", "high", "medium", "test"
}

// buildWebhookPayload converts an event into the appropriate JSON payload.
func buildWebhookPayload(format string, event *WebhookEvent) []byte {
	if format == "slack" {
		color := "#ff0000"
		if event.Conclusion == "success" {
			color = "#00cc66"
		} else if event.EventType == "test" {
			color = "#888888"
		}
		payload := map[string]interface{}{
			"text": fmt.Sprintf("*VizOps Alert* — %s", event.EventType),
			"attachments": []map[string]interface{}{
				{
					"color": color,
					"title": event.WorkflowName,
					"title_link": event.RunURL,
					"text":  event.Message,
					"fields": []map[string]interface{}{
						{"title": "Repository", "value": event.Repo, "short": true},
						{"title": "Run ID", "value": fmt.Sprintf("%d", event.RunID), "short": true},
						{"title": "Conclusion", "value": event.Conclusion, "short": true},
						{"title": "Severity", "value": event.Severity, "short": true},
					},
					"footer": "VizOps Neural Intelligence Hub",
				},
			},
		}
		data, _ := json.Marshal(payload)
		return data
	}

	// Generic JSON format
	payload := map[string]interface{}{
		"source":       "vizops",
		"event":        event.EventType,
		"repo":         event.Repo,
		"workflow":     event.WorkflowName,
		"runId":        event.RunID,
		"conclusion":   event.Conclusion,
		"runUrl":       event.RunURL,
		"message":      event.Message,
		"severity":     event.Severity,
		"timestamp":    time.Now().UTC().Format(time.RFC3339),
	}
	data, _ := json.Marshal(payload)
	return data
}

// deliverWebhook POSTs the payload to the target URL and returns the HTTP status code.
func deliverWebhook(url string, payload []byte) (int, error) {
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Post(url, "application/json", bytes.NewReader(payload))
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return resp.StatusCode, fmt.Errorf("non-2xx response: %s", resp.Status)
	}
	return resp.StatusCode, nil
}

// DeliverWebhooksForUser is called by the sync service to fan out event
// notifications to all active webhook configs for a given user.
func DeliverWebhooksForUser(userID string, event *WebhookEvent) {
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	filter := bson.M{
		"userId": userID,
		"active": true,
		"events": bson.M{"$in": []string{event.EventType, "all"}},
	}
	cursor, err := mongoClient.Database("admin").Collection("github_webhook_configs").
		Find(context.TODO(), filter)
	if err != nil {
		return
	}
	var configs []WebhookConfig
	_ = cursor.All(context.TODO(), &configs)

	for _, cfg := range configs {
		payload := buildWebhookPayload(cfg.Format, event)
		_, _ = deliverWebhook(cfg.URL, payload)
	}
}
