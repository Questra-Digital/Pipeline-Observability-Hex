package cronjob

import (
	"net/http"

	grpc_client "github.com/QuestraDigital/goServices/ArgoCD-Web-App/grpc_client"
	"github.com/gin-gonic/gin"
)

type ErrorResponse struct {
	Error   string `json:"error"`
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func GetCronjobStatus(c *gin.Context) {
	// Call the grpc server to get the cronjob status
	message, err := grpc_client.GetCronjobStatus(true)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{
			Error:   "Internal Server Error",
			Code:    http.StatusInternalServerError,
			Message: string(err.Error()),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": message})
}
