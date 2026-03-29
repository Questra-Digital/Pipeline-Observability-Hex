package github

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

type AIRCARequest struct {
	RunID int64  `json:"runId"`
	JobID int64  `json:"jobId"`
	Logs  string `json:"logs"`
}

func GetAIRCA(c *gin.Context) {
	var req AIRCARequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		logToFile(fmt.Sprintf("ERROR: [Manual-AI] GEMINI_API_KEY missing for Job #%d", req.JobID))
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "AI Service not configured. Please set GEMINI_API_KEY."})
		return
	}

	logToFile(fmt.Sprintf("START: [Manual-AI] Generating summary for Job #%d", req.JobID))

	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to connect to AI service"})
		return
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-2.5-flash")
	
	prompt := fmt.Sprintf(`CRITICAL: You are a production-grade CI/CD Root Cause Analysis (RCA) Engine. 
You MUST provide your analysis in EXACTLY this JSON structure and NOTHING ELSE. 
DO NOT include thoughts, markdown, preamble, or any other text before or after the JSON.

Expected JSON Structure (STRICT):
{
  "root_cause": "Short summary of the failure",
  "details": "Technical explanation of what happened",
  "countermeasures": ["Step 1 to fix", "Step 2 to prevent"],
  "severity": "High/Medium/Low",
  "failed_job": "Name of the job that failed",
  "failed_step": "Name of the specific step that failed"
}

IMPORTANT: DO NOT WRAP YOUR RESPONSE IN MARKDOWN CODE BLOCKS. 
DO NOT USE JSON CODE BLOCKS OR TRIPLE BACKTICKS. 
RETURN RAW JSON ONLY.
IF YOU NEED TO INCLUDE YAML OR CODE IN THE "details" OR "countermeasures" FIELDS, ESCAPE THE NEWLINES (e.g., use \n).

Logs to Analyze:
%s`, req.Logs)

	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		logToFile(fmt.Sprintf("ERROR: [Manual-AI] Generation failed for Job #%d: %v", req.JobID, err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate AI analysis"})
		return
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		logToFile(fmt.Sprintf("ERROR: [Manual-AI] Empty response for Job #%d", req.JobID))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI returned empty response"})
		return
	}

	// Extract the text content
	analysisText := ""
	if part, ok := resp.Candidates[0].Content.Parts[0].(genai.Text); ok {
		analysisText = string(part)
	}

	// Aggressive extraction of JSON from response
	if firstIdx := strings.Index(analysisText, "{"); firstIdx != -1 {
		if lastIdx := strings.LastIndex(analysisText, "}"); lastIdx != -1 && lastIdx > firstIdx {
			analysisText = analysisText[firstIdx : lastIdx+1]
		}
	}
	analysisText = strings.TrimSpace(analysisText)

	logToFile(fmt.Sprintf("SUCCESS: [Manual-AI] Summary complete for Job #%d", req.JobID))
	
	// Try to parse the analysis as JSON to return a structured object
	var analysisObj interface{}
	if err := json.Unmarshal([]byte(analysisText), &analysisObj); err == nil {
		c.JSON(http.StatusOK, gin.H{
			"runId":    req.RunID,
			"jobId":    req.JobID,
			"analysis": analysisObj,
		})
	} else {
		// Fallback to raw string if parsing fails
		c.JSON(http.StatusOK, gin.H{
			"runId":    req.RunID,
			"jobId":    req.JobID,
			"analysis": analysisText,
		})
	}
}
