package github

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller"
	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	mongoOptions "go.mongodb.org/mongo-driver/mongo/options"
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
	if cached := getCachedRCA(rcaColl, runID); cached != nil {
		// Attach live fingerprint count from DB
		if cached.Fingerprint != nil {
			enrichFingerprint(fingerprintColl, cached.Fingerprint)
		}
		c.JSON(http.StatusOK, cached)
		return
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
