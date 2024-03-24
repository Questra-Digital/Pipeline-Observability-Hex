package controller_test

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestChangePassword_Success(t *testing.T) {
	// Create a new Gin engine instance
	router := gin.Default()

	// Define a mock JWT middleware to set the claims
	router.Use(func(c *gin.Context) {
		// Mock JWT claims
		claims := gin.H{"email": "test@example.com"}

		// Set the claims in the Gin context
		c.Set("claims", claims)

		// Call the next handler
		c.Next()
	})

	// Define the route for the ChangePassword handler
	router.POST("/api/changepassword", controller.ChangePassword)

	// Create a new HTTP request with a JSON body containing the new password
	reqBody := `{"newPassword":"newpassword123"}`
	req, err := http.NewRequest("POST", "/api/changepassword", strings.NewReader(reqBody))
	assert.NoError(t, err)

	// Set the request content type to JSON
	req.Header.Set("Content-Type", "application/json")

	// Perform the request
	resp := httptest.NewRecorder()
	router.ServeHTTP(resp, req)

	// Check the response status code
	assert.Equal(t, http.StatusOK, resp.Code)

	// Check the response body
	expectedResponse := `{"message":"Password updated successfully"}`
	assert.Equal(t, expectedResponse, resp.Body.String())
}
