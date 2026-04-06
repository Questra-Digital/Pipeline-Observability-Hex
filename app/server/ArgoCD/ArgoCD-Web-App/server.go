package main

import (
	"fmt"
	"net/http"

	"github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller"
	argocdapi "github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller/argocd_api"
	configured_apps "github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller/configured_apps"
	"github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller/cronjob"
	github_controller "github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller/github"
	notificationtoggle "github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller/notification_toggle"
	"github.com/QuestraDigital/goServices/ArgoCD-Web-App/middleware"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables at startup
	if err := godotenv.Load(".env"); err != nil {
		fmt.Println("Warning: .env file not found, using system environment variables")
	}

	r := gin.Default()

	// Generic CORS configuration
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	r.Use(cors.New(config))

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	// ── Public (unauthenticated) ──────────────────────────────────────
	r.POST("/api/signup", controller.Signup)
	r.POST("/api/signin", controller.Signin)
	r.POST("/api/forgetpass", controller.ForgetPass)

	// ── Authenticated core routes ─────────────────────────────────────
	auth := r.Group("/api", middleware.AuthMiddleware())
	{
		// Dashboard
		auth.GET("/dashboard/stats", controller.GetDashboardStats)

		// Configured Apps (ArgoCD app list)
		auth.GET("/apps", configured_apps.GetAllApps)
		auth.GET("/apps/", configured_apps.GetAllApps)

		// ArgoCD Configuration
		auth.POST("/token", controller.StoreToken)
		auth.POST("/argocdurl", argocdapi.StoreArgoCDAPI)
		auth.GET("/argocdurl", argocdapi.GetArgoCDAPI)

		// Settings: Email, Slack, Custom Message, Deviation
		auth.POST("/email", controller.StoreEmail)
		auth.POST("/slack", controller.StoreSlackBot)
		auth.POST("/custom-message", controller.StoreCustomMessage)
		auth.GET("/custom-message", controller.GetCustomMessage)
		auth.POST("/deviation-value", controller.StoreDeviationValue)
		auth.GET("/deviation-value", controller.GetDeviationValue)

		// Password management
		auth.POST("/changepassword", controller.ChangePassword)

		// Cronjob control
		auth.GET("/runcronjob", controller.RunCronjob)
		auth.GET("/stopcronjob", controller.StopCronjob)
		auth.GET("/cronjob/status", cronjob.GetCronjobStatus)

		// Notification toggles
		auth.GET("/notification/email", notificationtoggle.ReadEmailNotificationStatus)
		auth.POST("/notification/email", notificationtoggle.UpdateEmailNotificationStatus)
		auth.GET("/notification/slack", notificationtoggle.ReadSlackNotificationStatus)
		auth.POST("/notification/slack", notificationtoggle.UpdateSlackNotificationStatus)

		// ArgoCD Pipeline WebSocket + History
		auth.GET("/pipelinestate", controller.DataPipelineState)
		auth.GET("/pipeline/history", controller.PipelineHistory)
	}

	// ArgoCD pipeline listing (used by dashboard selection screen)
	r.GET("/all_pipelines", middleware.AuthMiddleware(), controller.GetAllPipelines)

	// ── GitHub Actions endpoints ──────────────────────────────────────
	github := r.Group("/api/github", middleware.AuthMiddleware())
	{
		github.POST("/auth", github_controller.ConnectGitHubAccount)
		github.GET("/accounts", github_controller.GetGitHubAccounts)

		github.GET("/repos", github_controller.GetGitHubRepos)
		github.POST("/repos/toggle", github_controller.ToggleRepoMonitoring)

		github.GET("/status", github_controller.GetGitHubSettings)
		github.POST("/status", github_controller.UpdateGitHubStatus)

		github.GET("/limit", github_controller.GetGitHubSettings)
		github.POST("/limit", github_controller.UpdateGitHubLimit)

		github.GET("/runs", github_controller.GetGitHubRuns)
		github.GET("/analytics", github_controller.GetGitHubAnalytics)
		github.GET("/alerts", github_controller.GetGitHubAlerts)
		github.GET("/insights", github_controller.GetGitHubInsights)
		github.GET("/logs", github_controller.GetGitHubJobLogs)
		github.GET("/rca", github_controller.GetRootCauseAnalysis)
		github.POST("/ai-rca", github_controller.GetAIRCA)
		github.GET("/tickets", github_controller.GetTickets)
		github.GET("/tickets/sync", github_controller.SyncTickets)
		github.GET("/correlations", github_controller.GetFailureCorrelations)
		github.POST("/account/sync", github_controller.UpdateGitHubSyncInterval)
		github.DELETE("/account/:id", github_controller.DisconnectGitHubAccount)

		// ── Agentic: Workflow Dispatch ──────────────────────────────────
		github.GET("/workflows", github_controller.GetWorkflows)
		github.POST("/dispatch", github_controller.DispatchWorkflow)
		github.GET("/workflow-summary", github_controller.GetWorkflowSummary)

		// ── Agentic: Run Control ────────────────────────────────────────
		github.POST("/cancel", github_controller.CancelRun)
		github.POST("/retry", github_controller.RetryRun)
		github.POST("/retry-failed", github_controller.RetryFailedJobs)

		// ── Agentic: Outbound Webhook Notifications ──────────────────────
		github.GET("/webhooks", github_controller.GetWebhooks)
		github.POST("/webhooks", github_controller.CreateWebhook)
		github.DELETE("/webhooks/:id", github_controller.DeleteWebhook)
		github.POST("/webhooks/:id/test", github_controller.TestWebhook)
	}

	// Run the server
	if err := r.Run(":8000"); err != nil {
		fmt.Println("Error starting server:", err)
	}
}
