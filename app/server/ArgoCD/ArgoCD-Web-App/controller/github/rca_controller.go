package github

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller"
	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"github.com/google/generative-ai-go/genai"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	mongoOptions "go.mongodb.org/mongo-driver/mongo/options"
	"google.golang.org/api/option"
)

// GetRootCauseAnalysis is the HTTP handler for GET /api/github/rca
// Query params: runId (int), owner (string), repo (string)
func GetRootCauseAnalysis(c *gin.Context) {
	userEmail := controller.GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	runIDStr := c.Query("runId")
	owner := c.Query("owner")
	repo := c.Query("repo")

	if runIDStr == "" || owner == "" || repo == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "runId, owner, and repo are required query parameters"})
		return
	}

	runID, err := strconv.ParseInt(runIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid runId"})
		return
	}

	force := c.Query("force") == "true"

	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())
	db := mongoClient.Database("admin")

	rcaColl := db.Collection("github_rca")
	fingerprintColl := db.Collection("github_rca_fingerprints")

	// ──────────────────────────────────────────
	// Check cache first
	// ──────────────────────────────────────────
	apiKey := os.Getenv("GEMINI_API_KEY")
	if cached := getCachedRCA(rcaColl, runID); cached != nil && !force {
		// If we have an AI key but the cached result doesn't have AI analysis, OR it has the "Invalid JSON" placeholder, re-run!
		isInvalid := cached.AIAnalysis != nil && (
			strings.Contains(strings.ToUpper(cached.AIAnalysis.RootCause), "INVALID JSON") ||
			strings.Contains(cached.AIAnalysis.RootCause, "through deep-dive") ||
			cached.AIAnalysis.RootCause == "" )
		if apiKey == "" || (cached.AIAnalysis != nil && !isInvalid) {
			// Attach live fingerprint count from DB
			if cached.Fingerprint != nil {
				enrichFingerprint(fingerprintColl, cached.Fingerprint)
			}
			c.JSON(http.StatusOK, cached)
			return
		}
	}
	
	// If forced or invalid, log it
	if force {
		logToFile(fmt.Sprintf("FORCE: Refreshing analysis for Run #%d", runID))
	}

	// ──────────────────────────────────────────
	// 1. Fetch the WorkflowRun from MongoDB
	// ──────────────────────────────────────────
	runsColl := db.Collection("github_runs")
	var run WorkflowRun
	err = runsColl.FindOne(context.TODO(), bson.M{"runId": runID}).Decode(&run)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": fmt.Sprintf("Run %d not found in database", runID)})
		return
	}

	// ──────────────────────────────────────────
	// 2. Find the GitHub account for log access
	// ──────────────────────────────────────────
	accountsColl := db.Collection("github_accounts")
	var acc GitHubAccount
	err = accountsColl.FindOne(context.TODO(), bson.M{
		"_id":    run.AccountID,
		"userId": userEmail,
	}).Decode(&acc)
	if err != nil {
		err = accountsColl.FindOne(context.TODO(), bson.M{
			"userId": userEmail,
			"owner":  owner,
		}).Decode(&acc)
		if err != nil {
			// Fallback: any account for this user
			err = accountsColl.FindOne(context.TODO(), bson.M{"userId": userEmail}).Decode(&acc)
			if err != nil {
				c.JSON(http.StatusForbidden, gin.H{"error": "No authorized GitHub account found for this run"})
				return
			}
		}
	}

	// ──────────────────────────────────────────
	// 3. Find failed jobs and download logs
	// ──────────────────────────────────────────
	repoFullName := fmt.Sprintf("%s/%s", owner, repo)
	combinedLog := ""

	for _, job := range run.Jobs {
		if job.Conclusion != "failure" {
			continue
		}
		logText, fetchErr := downloadJobLog(acc.PAT, owner, repo, job.ID)
		if fetchErr != nil {
			logText = buildSyntheticLog(&job)
		}
		combinedLog += fmt.Sprintf("\n\n=== JOB: %s ===\n%s", job.Name, logText)
	}

	if combinedLog == "" {
		combinedLog = fmt.Sprintf("Workflow run %d with conclusion: %s. No job logs available.", runID, run.Conclusion)
	}

	// ──────────────────────────────────────────
	// 4. Run the RCA Engine
	// ──────────────────────────────────────────
	rcaResult := AnalyzeLogs(combinedLog, repoFullName, &run)

	// 4a. Enrich with Gemini AI if API Key is present (Feature Addition)
	// ──────────────────────────────────────────
	if apiKey != "" {
		logToFile(fmt.Sprintf("Triggering Gemini intelligence for Run #%d (%s/%s)", runID, owner, repo))
		ctx := context.Background()
		if aiResult, aiErr := analyzeWithGemini(ctx, apiKey, combinedLog); aiErr == nil {
			logToFile(fmt.Sprintf("SUCCESS: Neural analysis complete for Run #%d", runID))
			
			// Only suppress legacy results if the AI analysis was successfully parsed and has a non-placeholder root cause
			isSuccess := aiResult != nil && !strings.Contains(strings.ToUpper(aiResult.RootCause), "INVALID JSON") && !strings.Contains(aiResult.RootCause, "THROUGH DEEP-DIVE")
			
			rcaResult.AIAnalysis = aiResult
			if isSuccess {
				// Suppress legacy findings ONLY if AI actually worked
				rcaResult.Primary = nil
				rcaResult.Secondary = []Finding{}
			}
		} else {
			logToFile(fmt.Sprintf("ERROR: Gemini intelligence failed for Run #%d: %v", runID, aiErr))
		}
	} else {
		logToFile(fmt.Sprintf("SKIP: GEMINI_API_KEY not found in environment for Run #%d. Falling back to pattern engine.", runID))
	}

	// ──────────────────────────────────────────
	// 5. Fetch Code Snippets for locations (Feature 8)
	// ──────────────────────────────────────────
	sha := run.HeadSHA
	if sha == "" {
		sha = "main" // Fallback
	}
	if rcaResult.Primary != nil && rcaResult.Primary.CodeLocation != nil {
		rcaResult.Primary.CodeLocation.Snippet = fetchCodeSnippet(acc.PAT, owner, repo, sha, rcaResult.Primary.CodeLocation)
	}
	for i := range rcaResult.Secondary {
		if rcaResult.Secondary[i].CodeLocation != nil {
			rcaResult.Secondary[i].CodeLocation.Snippet = fetchCodeSnippet(acc.PAT, owner, repo, sha, rcaResult.Secondary[i].CodeLocation)
		}
	}

	// ──────────────────────────────────────────
	// 6. Update fingerprint in DB (Feature 3)
	// ──────────────────────────────────────────
	if rcaResult.Fingerprint != nil {
		upsertFingerprint(fingerprintColl, rcaResult.Fingerprint, repoFullName)
	}

	// ──────────────────────────────────────────
	// 7. Cache the result
	// ──────────────────────────────────────────
	cacheRCA(rcaColl, runID, rcaResult)

	c.JSON(http.StatusOK, rcaResult)
}

// downloadJobLog fetches actual log text from GitHub API (follows redirect)
func downloadJobLog(pat, owner, repo string, jobID int64) (string, error) {
	apiURL := fmt.Sprintf("https://api.github.com/repos/%s/%s/actions/jobs/%d/logs", owner, repo, jobID)
	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+pat)
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")

	client := &http.Client{
		Timeout: 30 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return nil
		},
	}

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return "", fmt.Errorf("job logs not available (may have expired)")
	}
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("GitHub API returned %d", resp.StatusCode)
	}

	// Cap at 2MB
	body, err := io.ReadAll(io.LimitReader(resp.Body, 2*1024*1024))
	if err != nil {
		return "", err
	}
	return string(body), nil
}

// buildSyntheticLog creates a minimal log from step metadata when actual logs aren't available
func buildSyntheticLog(job *Job) string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("Job '%s' failed\n", job.Name))
	for _, step := range job.Steps {
		status := step.Conclusion
		if status == "" {
			status = step.Status
		}
		sb.WriteString(fmt.Sprintf("Step %d: %s — %s\n", step.Number, step.Name, status))
		if step.Conclusion == "failure" {
			sb.WriteString(fmt.Sprintf("Error: Step '%s' exited with failure\n", step.Name))
		}
	}
	return sb.String()
}

// getCachedRCA checks for a cached RCA result no older than 1 hour
func getCachedRCA(coll *mongo.Collection, runID int64) *RCAResult {
	cutoff := time.Now().Add(-1 * time.Hour)
	var result RCAResult
	err := coll.FindOne(context.TODO(), bson.M{
		"runId":      runID,
		"analyzedAt": bson.M{"$gte": primitive.NewDateTimeFromTime(cutoff)},
	}).Decode(&result)
	if err != nil {
		return nil
	}
	result.FromCache = true
	now := time.Now()
	result.CachedAt = &now
	return &result
}

// cacheRCA stores the RCA result
func cacheRCA(coll *mongo.Collection, runID int64, result *RCAResult) {
	opts := mongoOptions.Update().SetUpsert(true)
	_, _ = coll.UpdateOne(context.TODO(),
		bson.M{"runId": runID},
		bson.M{"$set": result},
		opts,
	)
}

// upsertFingerprint manages error fingerprint tracking
func upsertFingerprint(coll *mongo.Collection, fp *Fingerprint, repoFullName string) {
	var existing bson.M
	err := coll.FindOne(context.TODO(), bson.M{"hash": fp.Hash, "type": "fingerprint"}).Decode(&existing)

	if err == mongo.ErrNoDocuments {
		_, _ = coll.InsertOne(context.TODO(), bson.M{
			"hash":      fp.Hash,
			"seenCount": 1,
			"firstSeen": primitive.NewDateTimeFromTime(time.Now()),
			"lastSeen":  primitive.NewDateTimeFromTime(time.Now()),
			"repos":     []string{repoFullName},
			"type":      "fingerprint",
		})
		fp.SeenCount = 1
	} else if err == nil {
		repos := []string{}
		if existing["repos"] != nil {
			if arr, ok := existing["repos"].(primitive.A); ok {
				for _, r := range arr {
					if s, ok := r.(string); ok {
						repos = append(repos, s)
					}
				}
			}
		}
		repoFound := false
		for _, r := range repos {
			if r == repoFullName {
				repoFound = true
				break
			}
		}
		if !repoFound {
			repos = append(repos, repoFullName)
		}

		opts := mongoOptions.Update()
		_, _ = coll.UpdateOne(context.TODO(),
			bson.M{"hash": fp.Hash},
			bson.M{
				"$inc": bson.M{"seenCount": 1},
				"$set": bson.M{
					"lastSeen": primitive.NewDateTimeFromTime(time.Now()),
					"repos":    repos,
				},
			},
			opts,
		)

		// Read updated count
		if sc, ok := existing["seenCount"].(int32); ok {
			fp.SeenCount = int(sc) + 1
		}
		if ft, ok := existing["firstSeen"].(primitive.DateTime); ok {
			fp.FirstSeen = ft.Time()
		}
		fp.Repos = repos
	}
}

// enrichFingerprint updates a fingerprint with current DB counts (for cache hits)
func enrichFingerprint(coll *mongo.Collection, fp *Fingerprint) {
	var existing bson.M
	err := coll.FindOne(context.TODO(), bson.M{"hash": fp.Hash}).Decode(&existing)
	if err != nil {
		return
	}
	if sc, ok := existing["seenCount"].(int32); ok {
		fp.SeenCount = int(sc)
	}
}

// fetchCodeSnippet retrieves ±5 lines around the error from GitHub
func fetchCodeSnippet(pat, owner, repo, sha string, loc *CodeLocation) string {
	apiURL := fmt.Sprintf("https://api.github.com/repos/%s/%s/contents/%s?ref=%s", owner, repo, loc.FilePath, sha)
	req, _ := http.NewRequest("GET", apiURL, nil)
	req.Header.Set("Authorization", "Bearer "+pat)
	req.Header.Set("Accept", "application/vnd.github.raw+json") // Get raw file content

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		return ""
	}
	defer resp.Body.Close()

	content, _ := io.ReadAll(resp.Body)
	lines := strings.Split(string(content), "\n")
	
	start := loc.Line - 5
	end := loc.Line + 5
	if start < 1 { start = 1 }
	if end > len(lines) { end = len(lines) }

	var snippet strings.Builder
	for i := start; i <= end; i++ {
		prefix := "  "
		if i == loc.Line {
			prefix = "> "
		}
		snippet.WriteString(fmt.Sprintf("%d %s%s\n", i, prefix, lines[i-1]))
	}

	return snippet.String()
}

// analyzeWithGemini calls the Gemini API to get a production-level RCA
func analyzeWithGemini(ctx context.Context, apiKey string, logs string) (*AIAnalysis, error) {
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return nil, err
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-2.5-flash")
	
	// Requesting a specific JSON structure from the AI with EXTREME STRICTNESS
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
%s`, logs)

	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return nil, err
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("empty AI response")
	}

	var analysisText string
	if part, ok := resp.Candidates[0].Content.Parts[0].(genai.Text); ok {
		analysisText = string(part)
	}

	// Aggressive extraction of JSON from response
	analysisText, _ = extractJSON(analysisText)

	var result AIAnalysis
	if err := json.Unmarshal([]byte(analysisText), &result); err != nil {
		// Second attempt: If JSON is still invalid but we have content, 
		// maybe it was not JSON at all but the AI's best guess.
		return &AIAnalysis{
			RootCause: "AI Analysis performed through deep-dive",
			Details:   analysisText,
			Severity:  "Review Required",
			Countermeasures: []string{"Manually review the detailed analysis above"},
		}, nil
	}

	return &result, nil
}

// logToFile writes a message to a persistent log file in the project for easier debugging
func logToFile(msg string) {
	f, err := os.OpenFile("gemini-ai.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		fmt.Printf("FAILED TO WRITE TO LOG FILE: %v\n", err)
		return
	}
	defer f.Close()
	timestamp := time.Now().Format("2006-01-02 15:04:05")
	if _, err := f.WriteString(fmt.Sprintf("[%s] %s\n", timestamp, msg)); err != nil {
		fmt.Printf("FAILED TO WRITE CONTENT: %v\n", err)
	}
}

func extractJSON(s string) (string, error) {
	// 1. First, look for markdown code blocks (Gemini's favorite output)
	if strings.Contains(s, "```") {
		parts := strings.Split(s, "```")
		for _, p := range parts {
			trimmed := strings.TrimSpace(p)
			if strings.HasPrefix(trimmed, "json") {
				trimmed = strings.TrimPrefix(trimmed, "json")
			}
			trimmed = strings.TrimSpace(trimmed)
			if json.Valid([]byte(trimmed)) {
				return trimmed, nil
			}
		}
	}

	// 2. Generic curly brace extraction
	start := strings.Index(s, "{")
	end := strings.LastIndex(s, "}")
	if start != -1 && end != -1 && end > start {
		trimmed := s[start : end+1]
		if json.Valid([]byte(trimmed)) {
			return trimmed, nil
		}
	}

	// 3. Last resort: Try raw string if it's already a clean JSON
	trimmed := strings.TrimSpace(s)
	if json.Valid([]byte(trimmed)) {
		return trimmed, nil
	}

	return "", fmt.Errorf("no valid JSON found in response")
}
