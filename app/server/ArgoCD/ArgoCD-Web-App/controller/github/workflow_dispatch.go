package github

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"sync"

	"github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller"
	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"github.com/google/go-github/v60/github"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// WorkflowInfo is a trimmed representation of a GitHub Actions workflow.
type WorkflowInfo struct {
	ID       int64  `json:"id"`
	Name     string `json:"name"`
	Path     string `json:"path"`
	State    string `json:"state"`
	HTMLURL  string `json:"htmlUrl"`
	BadgeURL string `json:"badgeUrl"`
}

// DispatchRequest is the body for POST /api/github/dispatch.
type DispatchRequest struct {
	AccountID  string                 `json:"accountId"  binding:"required"`
	Owner      string                 `json:"owner"      binding:"required"`
	Repo       string                 `json:"repo"       binding:"required"`
	WorkflowID int64                  `json:"workflowId" binding:"required"`
	Ref        string                 `json:"ref"        binding:"required"`
	Inputs     map[string]interface{} `json:"inputs"`
}

// GetWorkflows lists only workflows that have a workflow_dispatch trigger.
// GET /api/github/workflows?accountId=&owner=&repo=
func GetWorkflows(c *gin.Context) {
	userEmail := controller.GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	accountIDStr := c.Query("accountId")
	owner := c.Query("owner")
	repo := c.Query("repo")
	if accountIDStr == "" || owner == "" || repo == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "accountId, owner, and repo are required"})
		return
	}

	accountID, err := primitive.ObjectIDFromHex(accountIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid accountId"})
		return
	}

	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	var account GitHubAccount
	if err := mongoClient.Database("admin").Collection("github_accounts").
		FindOne(context.TODO(), bson.M{"_id": accountID, "userId": userEmail}).
		Decode(&account); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Account not found or access denied"})
		return
	}

	ghClient := github.NewClient(nil).WithAuthToken(account.PAT)
	workflows, _, err := ghClient.Actions.ListWorkflows(context.TODO(), owner, repo, &github.ListOptions{PerPage: 100})
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to fetch workflows: " + err.Error()})
		return
	}

	// For each workflow, fetch its YAML content and check for workflow_dispatch trigger.
	// Only include workflows that support it so dispatch never fails with a 422.
	var mu sync.Mutex
	var wg sync.WaitGroup
	result := make([]WorkflowInfo, 0)

	for _, w := range workflows.Workflows {
		wg.Add(1)
		go func(wf *github.Workflow) {
			defer wg.Done()

			// Get the raw workflow file content
			fileContent, _, _, err := ghClient.Repositories.GetContents(
				context.TODO(), owner, repo, wf.GetPath(),
				&github.RepositoryContentGetOptions{},
			)
			if err != nil {
				return
			}

			content, err := fileContent.GetContent()
			if err != nil {
				return
			}

			// Only include if the YAML contains workflow_dispatch trigger
			if !strings.Contains(content, "workflow_dispatch") {
				return
			}

			mu.Lock()
			result = append(result, WorkflowInfo{
				ID:       wf.GetID(),
				Name:     wf.GetName(),
				Path:     wf.GetPath(),
				State:    wf.GetState(),
				HTMLURL:  wf.GetHTMLURL(),
				BadgeURL: wf.GetBadgeURL(),
			})
			mu.Unlock()
		}(w)
	}
	wg.Wait()

	c.JSON(http.StatusOK, result)
}

// DispatchWorkflow triggers a workflow_dispatch event on GitHub.
// POST /api/github/dispatch
// Body: { accountId, owner, repo, workflowId, ref, inputs? }
func DispatchWorkflow(c *gin.Context) {
	userEmail := controller.GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req DispatchRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	accountID, err := primitive.ObjectIDFromHex(req.AccountID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid accountId"})
		return
	}

	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	var account GitHubAccount
	if err := mongoClient.Database("admin").Collection("github_accounts").
		FindOne(context.TODO(), bson.M{"_id": accountID, "userId": userEmail}).
		Decode(&account); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "Account not found or access denied"})
		return
	}

	ghClient := github.NewClient(nil).WithAuthToken(account.PAT)

	inputs := make(map[string]interface{})
	for k, v := range req.Inputs {
		// GitHub requires all workflow dispatch inputs to be strings.
		// Coerce numbers, booleans, and other types to string automatically.
		switch val := v.(type) {
		case string:
			inputs[k] = val
		default:
			inputs[k] = fmt.Sprintf("%v", val)
		}
	}

	event := github.CreateWorkflowDispatchEventRequest{
		Ref:    req.Ref,
		Inputs: inputs,
	}

	_, err = ghClient.Actions.CreateWorkflowDispatchEventByID(context.TODO(), req.Owner, req.Repo, req.WorkflowID, event)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to dispatch workflow: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "Workflow dispatched successfully",
		"workflowId": req.WorkflowID,
		"repo":       req.Owner + "/" + req.Repo,
		"ref":        req.Ref,
	})
}
