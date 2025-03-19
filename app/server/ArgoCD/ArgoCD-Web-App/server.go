package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller"
	argocd_api "github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller/argocd_api"
	apps "github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller/configured_apps"
	cronjob "github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller/cronjob"
	email_notifier "github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller/email_notification"
	notificationtoggle "github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller/notification_toggle"
	"github.com/QuestraDigital/goServices/ArgoCD-Web-App/middleware"

	"github.com/gin-contrib/cors" // Import the cors package from gin-contrib
	"github.com/gin-gonic/gin"
	// import grpc client
)

type ErrorResponse struct {
	Error   string `json:"error"`
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func main() {
	r := gin.Default()

	// Add CORS middleware
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"*"} // Specify origins you want to allow
	config.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE"}
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	config.AllowCredentials = true // Allow cookies to be sent cross-origin

	r.Use(cors.New(config))

	// Apply the AuthMiddleware to routes that require authentication
	r.Use(func(c *gin.Context) {
		log.Println("path: ", c.FullPath())
		if c.FullPath() != "/api/signin" && c.FullPath() != "/api/signup" && c.FullPath() != "/api/forgetpass" && c.FullPath() != "/pipeline_state" {
			middleware.AuthMiddleware()(c)
		}
	})

	// Define your routes here
	// get all the pipelines
	r.GET("/all_pipelines", func(c *gin.Context) {
		availble_pipelines, err := controller.GetAllPipelineNames()
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"Error": "Token error"})
			return
		}
		fmt.Println("Available Pipelines : ", availble_pipelines)
		c.JSON(http.StatusOK, gin.H{
			"available_pipeline": availble_pipelines,
		})
	})

	// store token in .env file
	r.POST("/api/token", func(c *gin.Context) {
		// Parse request body to get the "token" value
		var requestBody map[string]string
		if err := c.BindJSON(&requestBody); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		token := requestBody["token"]
		controller.StoreToken(c, token)
	})

	// store token in .env file
	r.POST("/api/email", func(c *gin.Context) {
		// Parse request body to get the "token" value
		var requestBody map[string]string
		if err := c.BindJSON(&requestBody); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		email := requestBody["email"]
		controller.StoreEmail(c, email)
	})

	// get current state of pipeline
	r.GET("/pipeline_state", func(c *gin.Context) {
		controller.DataPipelineState(c)
	})

	// get the history of pipeline
	r.GET("/pipeline_history", func(c *gin.Context) {
		controller.PipelineHistory(c)
	})

	r.POST("/api/deviation-value", func(c *gin.Context) {
		// Parse request body to get the "token" value
		var requestBody map[string]string
		if err := c.BindJSON(&requestBody); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		deviation_value := requestBody["deviation_value"]
		controller.StoreDeviationValue(c, deviation_value)
	})

	r.POST("/api/custom-message", func(c *gin.Context) {
		// Parse request body to get the "token" value
		var requestBody map[string]string
		if err := c.BindJSON(&requestBody); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		custom_message := requestBody["custom_message"]
		controller.StoreCustomMessage(c, custom_message)
	})

	r.POST("/api/signin", func(c *gin.Context) {
		// call the signin function from controller
		controller.Signin(c)
	})

	r.POST("/api/signup", func(c *gin.Context) {
		// call the signup function from controller
		controller.Signup(c)
	})

	r.POST("/api/forgetpass", func(c *gin.Context) {
		// call the forgetpass function from controller
		controller.ForgetPass(c)
	})

	r.POST("/api/changepassword", func(c *gin.Context) {
		// call the forgetpass function from controller
		controller.ChangePassword(c)
	})

	r.POST("/api/slack", func(c *gin.Context) {
		controller.StoreSlackBot(c)
	})

	r.GET("/api/runcronjob", func(c *gin.Context) {
		// call the cronjob function from controller
		controller.RunCronjob(c)
	})

	r.GET("/api/stopcronjob", func(c *gin.Context) {
		// call the cronjob function from controller
		controller.StopCronjob(c)
	})

	// notification routes for slack and email notification services
	r.GET("/api/notification/slack", func(c *gin.Context) {
		// call the cronjob function from controller
		notificationtoggle.ReadSlackNotificationStatus(c)
	})

	r.POST("/api/notification/slack", func(c *gin.Context) {
		// call the cronjob function from controller
		notificationtoggle.UpdateSlackNotificationStatus(c)
	})

	r.GET("/api/notification/email", func(c *gin.Context) {
		// call the cronjob function from controller
		notificationtoggle.ReadEmailNotificationStatus(c)
	})

	r.POST("/api/notification/email", func(c *gin.Context) {
		// call the cronjob function from controller
		notificationtoggle.UpdateEmailNotificationStatus(c)
	})

	// get all configured apps data
	r.GET("/api/apps/", func(c *gin.Context) {
		apps.GetAllApps(c)
	})

	// get cronjob status
	r.GET("/api/cronjob/status", func(c *gin.Context) {
		cronjob.GetCronjobStatus(c)
	})

	// get deviation value
	r.GET("/api/deviation-value", func(c *gin.Context) {
		controller.GetDeviationValue(c)
	})

	r.GET("/api/custom-message", func(c *gin.Context) {
		controller.GetCustomMessage(c)
	})

	// store the notifier email in the db
	r.POST("/api/notifier-email", func(c *gin.Context) {
		email_notifier.StoreNotifierEmail(c)
	})

	// get the notifier email from the db
	r.GET("/api/notifier-email", func(c *gin.Context) {
		email_notifier.GetNotifierEmail(c)
	})

	r.POST("/api/argocdurl", func(c *gin.Context) {
		argocd_api.StoreArgoCDAPI(c)
	})

	r.GET("/api/argocdurl", func(c *gin.Context) {
		argocd_api.GetArgoCDAPI(c)
	})

	r.GET("test", func(c *gin.Context) {
		controller.FetchPipelineData("test")
	})

	// Run the server
	if err := r.Run(":8000"); err != nil {
		fmt.Println("Error starting server:", err)
	}
}
