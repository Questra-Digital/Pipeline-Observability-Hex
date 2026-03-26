package main

import (
	"fmt"
	"net/http"

	"github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller"
	configured_apps "github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller/configured_apps"
	github_controller "github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller/github"
	"github.com/QuestraDigital/goServices/ArgoCD-Web-App/middleware"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
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

	// User authentication and management
	r.POST("/api/signup", controller.Signup)
	r.POST("/api/signin", controller.Signin)

	// Application management - Authenticated routes
	auth := r.Group("/api", middleware.AuthMiddleware())
	{
		auth.GET("/dashboard/stats", controller.GetDashboardStats)
		auth.GET("/apps", configured_apps.GetAllApps)
		auth.GET("/apps/", configured_apps.GetAllApps)
	}

	// GitHub Actions specific endpoints
	github := r.Group("/api/github", middleware.AuthMiddleware())
	{
		github.POST("/auth", github_controller.ConnectGitHubAccount)
		github.GET("/accounts", github_controller.GetGitHubAccounts)
		
		github.GET("/repos", github_controller.GetGitHubRepos)
		github.POST("/repos/toggle", github_controller.ToggleRepoMonitoring)
		
		github.GET("/status", github_controller.GetGitHubSettings)
		github.POST("/status", github_controller.UpdateGitHubStatus)
		
		github.GET("/limit", github_controller.GetGitHubSettings) // Reusing same settings getter
		github.POST("/limit", github_controller.UpdateGitHubLimit)

		github.GET("/runs", github_controller.GetGitHubRuns)
		github.GET("/analytics", github_controller.GetGitHubAnalytics)
		github.GET("/alerts", github_controller.GetGitHubAlerts)
		github.GET("/insights", github_controller.GetGitHubInsights)
		github.GET("/logs", github_controller.GetGitHubJobLogs)
		github.GET("/rca", github_controller.GetRootCauseAnalysis)
		github.POST("/account/sync", github_controller.UpdateGitHubSyncInterval)
		github.DELETE("/account/:id", github_controller.DisconnectGitHubAccount)
	}


	// Run the server
	if err := r.Run(":8000"); err != nil {
		fmt.Println("Error starting server:", err)
	}
}
