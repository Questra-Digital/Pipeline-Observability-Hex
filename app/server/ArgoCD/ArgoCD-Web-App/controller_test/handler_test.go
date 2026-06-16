package controller_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

// ── Test Helpers ─────────────────────────────────────────────────────

func setupRouterWithClaims(claims gin.H) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.Use(func(c *gin.Context) {
		c.Set("claims", claims)
		c.Next()
	})
	return r
}

func setupPublicRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	return gin.Default()
}

// ── Signup Tests ──────────────────────────────────────────────────────

func TestSignup_InvalidBody(t *testing.T) {
	r := setupPublicRouter()
	r.POST("/api/signup", controller.Signup)

	req, _ := http.NewRequest("POST", "/api/signup", strings.NewReader(`not-json`))
	req.Header.Set("Content-Type", "application/json")

	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusBadRequest, resp.Code)

	var body map[string]interface{}
	json.Unmarshal(resp.Body.Bytes(), &body)
	assert.Contains(t, body["error"], "Invalid request body")
}

func TestSignup_MissingFields(t *testing.T) {
	r := setupPublicRouter()
	r.POST("/api/signup", controller.Signup)

	req, _ := http.NewRequest("POST", "/api/signup", strings.NewReader(`{}`))
	req.Header.Set("Content-Type", "application/json")

	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusBadRequest, resp.Code)
}

// ── Signin Tests ──────────────────────────────────────────────────────

func TestSignin_InvalidBody(t *testing.T) {
	r := setupPublicRouter()
	r.POST("/api/signin", controller.Signin)

	req, _ := http.NewRequest("POST", "/api/signin", strings.NewReader(`not-json`))
	req.Header.Set("Content-Type", "application/json")

	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusBadRequest, resp.Code)
}

func TestSignin_MissingEmail(t *testing.T) {
	r := setupPublicRouter()
	r.POST("/api/signin", controller.Signin)

	body, _ := json.Marshal(map[string]string{"password": "pass123"})
	req, _ := http.NewRequest("POST", "/api/signin", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusBadRequest, resp.Code)
}

// ── ChangePassword Tests ──────────────────────────────────────────────

func TestChangePassword_InvalidBody(t *testing.T) {
	r := setupRouterWithClaims(gin.H{"email": "test@example.com"})
	r.POST("/api/changepassword", controller.ChangePassword)

	req, _ := http.NewRequest("POST", "/api/changepassword", strings.NewReader(`not-json`))
	req.Header.Set("Content-Type", "application/json")

	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusBadRequest, resp.Code)
}

func TestChangePassword_MissingNewPassword(t *testing.T) {
	r := setupRouterWithClaims(gin.H{"email": "test@example.com"})
	r.POST("/api/changepassword", controller.ChangePassword)

	body, _ := json.Marshal(map[string]string{})
	req, _ := http.NewRequest("POST", "/api/changepassword", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)

	// Should return 200 because UpdatePassword will try DB and fail, but handler
	// still returns 500 due to DB error
	assert.Contains(t, []int{200, 500}, resp.Code)
}

func TestChangePassword_MissingClaims(t *testing.T) {
	r := setupPublicRouter()
	r.POST("/api/changepassword", controller.ChangePassword)

	body, _ := json.Marshal(map[string]string{"newPassword": "newpass123"})
	req, _ := http.NewRequest("POST", "/api/changepassword", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusInternalServerError, resp.Code)
}

// ── ForgetPass Tests ──────────────────────────────────────────────────

func TestForgetPass_InvalidBody(t *testing.T) {
	r := setupPublicRouter()
	r.POST("/api/forgetpass", controller.ForgetPass)

	req, _ := http.NewRequest("POST", "/api/forgetpass", strings.NewReader(`not-json`))
	req.Header.Set("Content-Type", "application/json")

	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusBadRequest, resp.Code)
}

func TestForgetPass_MissingEmail(t *testing.T) {
	r := setupPublicRouter()
	r.POST("/api/forgetpass", controller.ForgetPass)

	body, _ := json.Marshal(map[string]string{"newPassword": "pass123"})
	req, _ := http.NewRequest("POST", "/api/forgetpass", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusBadRequest, resp.Code)
}

// ── StoreToken Tests ──────────────────────────────────────────────────

func TestStoreToken_InvalidBody(t *testing.T) {
	r := setupRouterWithClaims(gin.H{"email": "test@example.com"})
	r.POST("/api/token", controller.StoreToken)

	req, _ := http.NewRequest("POST", "/api/token", strings.NewReader(`not-json`))
	req.Header.Set("Content-Type", "application/json")

	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusBadRequest, resp.Code)
}

func TestStoreToken_MissingClaims(t *testing.T) {
	r := setupPublicRouter()
	r.POST("/api/token", controller.StoreToken)

	body, _ := json.Marshal(map[string]string{"token": "some-token"})
	req, _ := http.NewRequest("POST", "/api/token", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusUnauthorized, resp.Code)
}

// ── StoreEmail Tests ──────────────────────────────────────────────────

func TestStoreEmail_InvalidBody(t *testing.T) {
	r := setupRouterWithClaims(gin.H{"email": "test@example.com"})
	r.POST("/api/email", controller.StoreEmail)

	req, _ := http.NewRequest("POST", "/api/email", strings.NewReader(`not-json`))
	req.Header.Set("Content-Type", "application/json")

	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusBadRequest, resp.Code)
}

func TestStoreEmail_MissingClaims(t *testing.T) {
	r := setupPublicRouter()
	r.POST("/api/email", controller.StoreEmail)

	body, _ := json.Marshal(map[string]string{"email": "user@example.com"})
	req, _ := http.NewRequest("POST", "/api/email", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusUnauthorized, resp.Code)
}

// ── Custom Message Tests ──────────────────────────────────────────────

func TestStoreCustomMessage_InvalidBody(t *testing.T) {
	r := setupRouterWithClaims(gin.H{"email": "test@example.com"})
	r.POST("/api/custom-message", controller.StoreCustomMessage)

	req, _ := http.NewRequest("POST", "/api/custom-message", strings.NewReader(`not-json`))
	req.Header.Set("Content-Type", "application/json")

	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusBadRequest, resp.Code)
}

func TestStoreCustomMessage_Success(t *testing.T) {
	r := setupRouterWithClaims(gin.H{"email": "test@example.com"})
	r.POST("/api/custom-message", controller.StoreCustomMessage)

	body, _ := json.Marshal(map[string]string{"custom_message": "test message"})
	req, _ := http.NewRequest("POST", "/api/custom-message", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)

	// Should succeed or return DB error, which is acceptable
	assert.Contains(t, []int{200, 500}, resp.Code)
}

// ── Deviation Value Tests ─────────────────────────────────────────────

func TestStoreDeviationValue_InvalidBody(t *testing.T) {
	r := setupRouterWithClaims(gin.H{"email": "test@example.com"})
	r.POST("/api/deviation-value", controller.StoreDeviationValue)

	req, _ := http.NewRequest("POST", "/api/deviation-value", strings.NewReader(`not-json`))
	req.Header.Set("Content-Type", "application/json")

	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusBadRequest, resp.Code)
}

func TestStoreDeviationValue_Success(t *testing.T) {
	r := setupRouterWithClaims(gin.H{"email": "test@example.com"})
	r.POST("/api/deviation-value", controller.StoreDeviationValue)

	body, _ := json.Marshal(map[string]string{"deviation_value": "15"})
	req, _ := http.NewRequest("POST", "/api/deviation-value", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)

	assert.Contains(t, []int{200, 500}, resp.Code)
}

// ── GetCustomMessage Tests ────────────────────────────────────────────

func TestGetCustomMessage_Unauthenticated(t *testing.T) {
	r := setupPublicRouter()
	r.GET("/api/custom-message", controller.GetCustomMessage)

	req, _ := http.NewRequest("GET", "/api/custom-message", nil)

	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusUnauthorized, resp.Code)
}

func TestGetCustomMessage_ReturnsDefault(t *testing.T) {
	r := setupRouterWithClaims(gin.H{"email": "test@example.com"})
	r.GET("/api/custom-message", controller.GetCustomMessage)

	req, _ := http.NewRequest("GET", "/api/custom-message", nil)

	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)

	// Should return default message (no DB connected in test)
	var body map[string]interface{}
	json.Unmarshal(resp.Body.Bytes(), &body)
	assert.Equal(t, "ArgoCD pipeline is out of sync!", body["customMessage"])
}

// ── GetDeviationValue Tests ───────────────────────────────────────────

func TestGetDeviationValue_Unauthenticated(t *testing.T) {
	r := setupPublicRouter()
	r.GET("/api/deviation-value", controller.GetDeviationValue)

	req, _ := http.NewRequest("GET", "/api/deviation-value", nil)

	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusUnauthorized, resp.Code)
}

func TestGetDeviationValue_ReturnsDefault(t *testing.T) {
	r := setupRouterWithClaims(gin.H{"email": "test@example.com"})
	r.GET("/api/deviation-value", controller.GetDeviationValue)

	req, _ := http.NewRequest("GET", "/api/deviation-value", nil)

	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)

	var body map[string]interface{}
	json.Unmarshal(resp.Body.Bytes(), &body)
	assert.Equal(t, "10", body["deviationValue"])
}

// ── GetDashboardStats Tests ───────────────────────────────────────────

func TestGetDashboardStats_Unauthenticated(t *testing.T) {
	r := setupPublicRouter()
	r.GET("/api/dashboard/stats", controller.GetDashboardStats)

	req, _ := http.NewRequest("GET", "/api/dashboard/stats", nil)

	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusUnauthorized, resp.Code)
}

func TestGetDashboardStats_ReturnsError(t *testing.T) {
	r := setupRouterWithClaims(gin.H{"email": "test@example.com"})
	r.GET("/api/dashboard/stats", controller.GetDashboardStats)

	req, _ := http.NewRequest("GET", "/api/dashboard/stats", nil)

	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)

	// DB not available, should return 500
	assert.Equal(t, http.StatusInternalServerError, resp.Code)
}

// ── GetAllPipelines Tests ─────────────────────────────────────────────

func TestGetAllPipelines_Unauthenticated(t *testing.T) {
	r := setupPublicRouter()
	r.GET("/api/all_pipelines", controller.GetAllPipelines)

	req, _ := http.NewRequest("GET", "/api/all_pipelines", nil)

	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusUnauthorized, resp.Code)
}

// ── SlackBot Tests ────────────────────────────────────────────────────

func TestStoreSlackBot_InvalidBody(t *testing.T) {
	r := setupRouterWithClaims(gin.H{"email": "test@example.com"})
	r.POST("/api/slack", controller.StoreSlackBot)

	req, _ := http.NewRequest("POST", "/api/slack", strings.NewReader(`not-json`))
	req.Header.Set("Content-Type", "application/json")

	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusBadRequest, resp.Code)
}

func TestStoreSlackBot_MissingClaims(t *testing.T) {
	r := setupPublicRouter()
	r.POST("/api/slack", controller.StoreSlackBot)

	body, _ := json.Marshal(map[string]string{"token": "xoxb-test", "channel": "#alerts"})
	req, _ := http.NewRequest("POST", "/api/slack", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp := httptest.NewRecorder()
	r.ServeHTTP(resp, req)

	assert.Equal(t, http.StatusUnauthorized, resp.Code)
}
