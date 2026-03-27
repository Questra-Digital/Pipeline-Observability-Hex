package github

import (
	"crypto/md5"
	"fmt"
	"math"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// ─────────────────────────────────────────────
// RULE STRUCT (Feature 8: Extensible Design)
// ─────────────────────────────────────────────

type Rule struct {
	Pattern     *regexp.Regexp
	Weight      float64 // 0.2 weak, 0.5 strong, 0.8 definitive
	Category    string
	Severity    string // critical | warning | info
	Remediation func(match string, log string) string
}

type Finding struct {
	Category     string   `json:"category"`
	Severity     string   `json:"severity"`
	Confidence   float64  `json:"confidence"` // 0.0–1.0 (Feature 1)
	Evidence     []string      `json:"evidence"`   // 10-line context (Feature 2)
	Remediation  string        `json:"remediation"`
	MatchedLines []string      `json:"matchedLines"`
	CodeLocation *CodeLocation `json:"codeLocation,omitempty"` // New: For code context injection
	Weight       float64       `json:"-"`                      // internal accumulator
	Count        int      `json:"-"` // matches found
}

// Feature 7: Anomaly flags detected inside log
type LogAnomaly struct {
	Type        string `json:"type"`
	Description string `json:"description"`
	Severity    string `json:"severity"`
}

type CodeLocation struct {
	FilePath string `json:"filePath"`
	Line     int    `json:"line"`
	Snippet  string `json:"snippet,omitempty"`
}

// Feature 5: Step/Job timeline
type TimelineEntry struct {
	JobName       string  `json:"jobName"`
	StepName      string  `json:"stepName"`
	Status        string  `json:"status"`
	DurationSec   float64 `json:"durationSec"`
	IsFailed      bool    `json:"isFailed"`
	IsLastSuccess bool    `json:"isLastSuccess"`
}

// Feature 3: Error fingerprint
type Fingerprint struct {
	Hash      string    `json:"hash" bson:"hash"`
	SeenCount int       `json:"seenCount" bson:"seenCount"`
	FirstSeen time.Time `json:"firstSeen" bson:"firstSeen"`
	LastSeen  time.Time `json:"lastSeen" bson:"lastSeen"`
	Repos     []string  `json:"repos" bson:"repos"`
}

// Full RCA Result
type RCAResult struct {
	RunID      int64          `json:"runId" bson:"runId"`
	RepoName   string         `json:"repoName" bson:"repoName"`
	AnalyzedAt time.Time      `json:"analyzedAt" bson:"analyzedAt"`
	CachedAt   *time.Time     `json:"cachedAt,omitempty" bson:"cachedAt,omitempty"`
	FromCache  bool           `json:"fromCache" bson:"fromCache"`

	// Core diagnosis (Feature 2: multi-layer)
	Primary    *Finding  `json:"primary"`
	Secondary  []Finding `json:"secondary"`

	// Feature 3: fingerprint
	Fingerprint *Fingerprint `json:"fingerprint"`

	// Feature 5: timeline
	Timeline []TimelineEntry `json:"timeline"`

	// Feature 7: anomaly flags
	Anomalies []LogAnomaly `json:"anomalies"`

	// Summary sentence for quick reading
	Summary string `json:"summary"`
}

// ─────────────────────────────────────────────
// THE RULE LIBRARY
// All 8 categories with weighted patterns + dynamic remediation
// ─────────────────────────────────────────────

var ruleLibrary = []Rule{
	// ── ENV / SECRETS ──
	{
		Pattern:  regexp.MustCompile(`(?i)(required|error|fatal).*?(env|environment)\s+var(iable)?|env var .* (not set|is not defined|undefined|missing)|getenv.*empty|env\.get.*returns empty|\$\w+ is not set|\w+_TOKEN is not set|GITHUB_TOKEN.*missing`),
		Weight:   0.85,
		Category: "Missing ENV Variable / Secret",
		Severity: "critical",
		Remediation: func(match, log string) string {
			varRe := regexp.MustCompile(`\b([A-Z_]{3,})\s+is not set|\$([A-Z_]{3,})|env\.get\(["']([A-Z_a-z]{3,})["']\)`)
			if m := varRe.FindStringSubmatch(match); m != nil {
				for i := 1; i < len(m); i++ {
					if m[i] != "" {
						return fmt.Sprintf("Add the secret `%s` to your repository → Settings → Secrets and Variables → Actions. Reference it in your YAML as `${{ secrets.%s }}`.", m[i], m[i])
					}
				}
			}
			return "Add the required environment variable to your repository secrets (Settings → Secrets and Variables → Actions) and reference it in your workflow YAML."
		},
	},

	// ── DEPENDENCY FAILURE (Expanded) ──
	{
		Pattern:  regexp.MustCompile(`(?i)npm\s+err!|npm\s+error|cannot find module|module not found|err_module_not_found|no module named|importerror.*no module|cannot find package|go: module|ModuleNotFoundError|pip install.*failed|failed to resolve|composer\s+error|gem\s+not\s+found|bundle\s+install.*failed`),
		Weight:   0.85,
		Category: "Dependency Failure",
		Severity: "critical",
		Remediation: func(match, log string) string {
			if strings.Contains(strings.ToLower(match), "npm") {
				return "Node dependency error. Check your `package.json` for missing version ranges. Try running `npm install` locally to debug."
			}
			if strings.Contains(strings.ToLower(match), "pip") || strings.Contains(strings.ToLower(match), "module") {
				return "Python dependency error. Ensure all required packages are listed in `requirements.txt` or `pyproject.toml`."
			}
			return "A dependency could not be resolved. Run your package manager install command locally and ensure all lock files are up to date and committed."
		},
	},

	// ── COMPILATION / SYNTAX ERROR (New Specifics) ──
	{
		Pattern:  regexp.MustCompile(`(?i)panic:|runtime error:|unexpected\s+EOF|slice\s+bounds\s+out\s+of\s+range|nil\s+pointer\s+dereference|stack\s+overflow`),
		Weight:   0.90,
		Category: "Runtime Panic / Crash",
		Severity: "critical",
		Remediation: func(match, log string) string {
			return "Your code crashed at runtime with a panic. Review the stack trace in the evidence below to identify the exact line of code causing the crash."
		},
	},
	{
		Pattern:  regexp.MustCompile(`(?i)Uncaught\s+TypeError|Cannot\s+read\s+properties\s+of\s+null|is\s+not\s+a\s+function|SyntaxError:\s+Unexpected\s+token`),
		Weight:   0.80,
		Category: "Javascript Runtime Error",
		Severity: "critical",
		Remediation: func(match, log string) string {
			return "A Javascript runtime error occurred. Check the offending line in the log evidence. This often happens when accessing properties of an undefined variable."
		},
	},

	// ── DATABASE / INFRA ──
	{
		Pattern:  regexp.MustCompile(`(?i)dial\s+tcp.*connection\s+refused|failed\s+to\s+connect\s+to\s+host|mongo.*timeout|redis.*connection|postgres.*error|sql:\s+no\s+rows|database\s+connection\s+failed`),
		Weight:   0.75,
		Category: "Database Connection Failure",
		Severity: "critical",
		Remediation: func(match, log string) string {
			return "Unable to connect to the database. Verify that your DB connection strings are correct and that the database service (or Docker container) is reachable from the runner."
		},
	},

	// ── PERMISSION / AUTH ──
	{
		Pattern:  regexp.MustCompile(`(?i)permission denied|EACCES|EPERM|403\s+forbidden|401\s+unauthorized|authentication\s+failed|auth\s+error|access\s+denied|you\s+don.t\s+have\s+access|insufficient\s+permissions|credentials\s+expired|invalid\s+token`),
		Weight:   0.85,
		Category: "Permission / Authentication Error",
		Severity: "critical",
		Remediation: func(match, log string) string {
			return "Check your API tokens and permissions. For GitHub Actions, ensure the `GITHUB_TOKEN` has the specific `permissions:` scopes required for this job."
		},
	},

	// ── CLOUD / AWS SPECIFIC ──
	{
		Pattern:  regexp.MustCompile(`(?i)AccessDenied|AssumeRoleWithWebIdentity|ExpiredToken|CredentialsError|SignatureDoesNotMatch`),
		Weight:   0.80,
		Category: "Cloud Credentials Error (AWS/Azure/GCP)",
		Severity: "critical",
		Remediation: func(match, log string) string {
			return "Cloud authentication failed. Check your OIDC role configuration or the expiration of your cloud credentials/secrets."
		},
	},

	// ── DOCKER / CONTAINER ──
	{
		Pattern:  regexp.MustCompile(`(?i)cannot\s+connect\s+to\s+the\s+docker\s+daemon|docker:\s+error|pull\s+access\s+denied|manifest\s+unknown|no\s+such\s+image|docker\s+build.*failed`),
		Weight:   0.80,
		Category: "Docker / Container Error",
		Severity: "critical",
		Remediation: func(match, log string) string {
			return "Docker operation failed. Check if the Docker daemon is accessible and your image tags/registry credentials are correct."
		},
	},

	// ── TEST FAILURE ──
	{
		Pattern:  regexp.MustCompile(`(?i)FAIL\t|--- FAIL|test\s+failed|tests?\s+failed|assertion\s+failed|AssertionError|expected.*to\s+equal|jest.*failed|pytest.*failed|❌\s+\w`),
		Weight:   0.70,
		Category: "Test Failure",
		Severity: "warning",
		Remediation: func(match, log string) string {
			return "Unit tests failed. Reproduce locally using your test runner. Review the diff output in the evidence to see the exact assertion failure."
		},
	},

	// ── TIMEOUT / OOM ──
	{
		Pattern:  regexp.MustCompile(`(?i)timed?\s*out|ETIMEDOUT|context\s+deadline\s+exceeded|killed\s|out\s+of\s+memory|OOMKilled|heap\s+space`),
		Weight:   0.80,
		Category: "Resource Exhaustion (Timeout / OOM)",
		Severity: "critical",
		Remediation: func(match, log string) string {
			if strings.Contains(strings.ToLower(match), "memory") || strings.Contains(strings.ToLower(match), "oom") {
				return "The process ran out of memory. Consider increasing the runner size or optimizing memory-heavy steps (e.g., node build flags)."
			}
			return "The process timed out. Try increasing the `timeout-minutes` in your workflow YAML or optimizing the slow step."
		},
	},

	// ── BUILD SYSTEM ──
	{
		Pattern:  regexp.MustCompile(`(?i)exit\s+code\s+[1-9]|exit\s+status\s+[1-9]|command\s+not\s+found|sh:\s+line\s+\d+:\s+.*not\s+found`),
		Weight:   0.40,
		Category: "General Command Failure",
		Severity: "warning",
		Remediation: func(match, log string) string {
			return "A command in your workflow exited with a non-zero status. Check for typos in your scripts or missing binaries in the runner environment."
		},
	},
}

// ─────────────────────────────────────────────
// CORE ENGINE FUNCTIONS
// ─────────────────────────────────────────────

// AnalyzeLogs is the main entry point. Returns a full RCA result.
func AnalyzeLogs(logText, repoFullName string, run *WorkflowRun) *RCAResult {
	result := &RCAResult{
		AnalyzedAt: time.Now(),
		Anomalies:  []LogAnomaly{},
		Secondary:  []Finding{},
		Timeline:   []TimelineEntry{},
	}

	if run != nil {
		result.RunID = run.RunID
		result.RepoName = repoFullName
	}

	// Feature 7: Detect log-level anomalies first
	result.Anomalies = detectLogAnomalies(logText, run)

	// Feature 5: Build timeline from run data
	if run != nil {
		result.Timeline = buildTimeline(run)
	}

	// Feature 1+2+8: Multi-layer confidence scoring
	findings := scoreLog(logText)

	if len(findings) > 0 {
		result.Primary = &findings[0]
		if len(findings) > 1 {
			result.Secondary = findings[1:]
		}
		result.Summary = buildSummary(result.Primary, run)
	} else {
		// Catch-all: extract last error lines
		result.Primary = catchAllFinding(logText)
		result.Summary = "Pipeline failed — no specific root cause pattern matched. Review the error evidence below."
	}

	// Feature 3: Fingerprinting
	result.Fingerprint = computeFingerprint(logText, repoFullName)

	return result
}

// scoreLog runs ALL rules against the log and returns findings sorted by confidence.
// Feature 1 + 2: multi-layer, all matches, confidence score per category.
func scoreLog(logText string) []Finding {
	// Accumulate scores per category
	categoryMap := map[string]*Finding{}
	lines := strings.Split(logText, "\n")

	for _, rule := range ruleLibrary {
		allMatches := rule.Pattern.FindAllString(logText, -1)
		if len(allMatches) == 0 {
			continue
		}

		cat := rule.Category
		if _, exists := categoryMap[cat]; !exists {
			categoryMap[cat] = &Finding{
				Category: cat,
				Severity: rule.Severity,
			}
		}
		f := categoryMap[cat]
		for _, m := range allMatches {
			f.Weight += rule.Weight
			f.Count++
			f.MatchedLines = appendUnique(f.MatchedLines, m)
		}

		// Dynamic remediation from the FIRST/highest-weight rule for this category
		if f.Remediation == "" && len(allMatches) > 0 {
			f.Remediation = rule.Remediation(allMatches[0], logText)
		}

		// Extract evidence context for first match
		if len(f.Evidence) == 0 {
			firstMatchLine := firstLineContaining(lines, allMatches[0])
			f.Evidence = surroundingLines(lines, firstMatchLine, 5)
			
			// New: Extract code location from the evidence
			f.CodeLocation = ExtractCodeLocation(f.Evidence)
		}
	}

	// Normalize confidence: score = tanh(weight), maps to 0-1 smoothly
	var findings []Finding
	for _, f := range categoryMap {
		f.Confidence = math.Tanh(f.Weight)
		if f.Confidence > 1.0 { f.Confidence = 1.0 }
		findings = append(findings, *f)
	}

	// Sort by confidence descending
	for i := 0; i < len(findings)-1; i++ {
		for j := i + 1; j < len(findings); j++ {
			if findings[j].Confidence > findings[i].Confidence {
				findings[i], findings[j] = findings[j], findings[i]
			}
		}
	}

	return findings
}

// Feature 3: Error Fingerprinting
func computeFingerprint(logText, repoFullName string) *Fingerprint {
	// Clean the log: remove timestamps, run IDs, memory addresses
	cleanRe := regexp.MustCompile(`\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}|\s+0x[0-9a-f]+|\brun\s+#?\d+\b`)
	cleaned := cleanRe.ReplaceAllString(logText, "")

	// Only fingerprint error lines
	errorRe := regexp.MustCompile(`(?i)(error|fail|fatal|killed|denied|timeout).*`)
	errorLines := strings.Join(errorRe.FindAllString(cleaned, 50), "\n")

	hash := fmt.Sprintf("%x", md5.Sum([]byte(errorLines)))

	return &Fingerprint{
		Hash:      hash,
		FirstSeen: time.Now(), // Will be updated from DB if already exists
		LastSeen:  time.Now(),
		Repos:     []string{repoFullName},
	}
}

// Feature 5: Build timeline from job/step data
func buildTimeline(run *WorkflowRun) []TimelineEntry {
	var timeline []TimelineEntry
	lastSuccessSet := false

	for _, job := range run.Jobs {
		for i, step := range job.Steps {
			startMs := step.StartedAt.Time().UnixMilli()
			endMs := step.CompletedAt.Time().UnixMilli()
			durSec := 0.0
			if endMs > startMs {
				durSec = float64(endMs-startMs) / 1000.0
			}

			isFailed := step.Conclusion == "failure"
			isLastSuccess := false

			// The step just before the first failure is "last success"
			if !isFailed && !lastSuccessSet {
				// Look ahead: is next step a failure?
				if i+1 < len(job.Steps) && job.Steps[i+1].Conclusion == "failure" {
					isLastSuccess = true
					lastSuccessSet = true
				}
			}

			timeline = append(timeline, TimelineEntry{
				JobName:       job.Name,
				StepName:      step.Name,
				Status:        step.Conclusion,
				DurationSec:   durSec,
				IsFailed:      isFailed,
				IsLastSuccess: isLastSuccess,
			})
		}
	}
	return timeline
}

// Feature 7: Log-level anomaly detection
func detectLogAnomalies(logText string, run *WorkflowRun) []LogAnomaly {
	var anomalies []LogAnomaly
	lines := strings.Split(logText, "\n")

	// 1. Log size spike
	if len(logText) > 500_000 {
		anomalies = append(anomalies, LogAnomaly{
			Type:        "large_log",
			Description: fmt.Sprintf("Log size unusually large (%d KB) — possible infinite loop or excessive output", len(logText)/1024),
			Severity:    "warning",
		})
	}

	// 2. Retry storms
	retryRe := regexp.MustCompile(`(?i)(retry|retrying|attempt\s+\d+\s+of\s+\d+)`)
	retryMatches := retryRe.FindAllString(logText, -1)
	if len(retryMatches) > 5 {
		anomalies = append(anomalies, LogAnomaly{
			Type:        "retry_storm",
			Description: fmt.Sprintf("Detected %d retry attempts — the step is repeatedly failing and retrying", len(retryMatches)),
			Severity:    "warning",
		})
	}

	// 3. Duplicate error lines (flapping)
	lineCount := map[string]int{}
	for _, l := range lines {
		trimmed := strings.TrimSpace(l)
		if len(trimmed) > 10 {
			lineCount[trimmed]++
		}
	}
	for line, count := range lineCount {
		if count > 10 && (strings.Contains(strings.ToLower(line), "error") || strings.Contains(strings.ToLower(line), "fail")) {
			anomalies = append(anomalies, LogAnomaly{
				Type:        "repeating_error",
				Description: fmt.Sprintf("Error line repeated %d times: \"%s\"", count, truncate(line, 80)),
				Severity:    "critical",
			})
			break // Report once
		}
	}

	// 4. Very fast failure (< 10 seconds total) = likely config issue
	if run != nil {
		totalDur := 0.0
		for _, job := range run.Jobs {
			for _, step := range job.Steps {
				s := step.StartedAt.Time().UnixMilli()
				e := step.CompletedAt.Time().UnixMilli()
				if e > s {
					totalDur += float64(e-s) / 1000.0
				}
			}
		}
		if totalDur > 0 && totalDur < 10.0 {
			anomalies = append(anomalies, LogAnomaly{
				Type:        "instant_failure",
				Description: fmt.Sprintf("Pipeline failed after only %.1fs — likely a configuration or YAML syntax error, not a runtime error", totalDur),
				Severity:    "critical",
			})
		}
	}

	return anomalies
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

func buildSummary(f *Finding, run *WorkflowRun) string {
	if f == nil {
		return "Unable to determine root cause."
	}
	summary := fmt.Sprintf("Failure diagnosed as %s (%.0f%% confidence)", f.Category, f.Confidence*100)
	if run != nil && len(run.Jobs) > 0 {
		for _, job := range run.Jobs {
			if job.Conclusion == "failure" {
				for _, step := range job.Steps {
					if step.Conclusion == "failure" {
						summary += fmt.Sprintf(" — failed at step \"%s\" in job \"%s\"", step.Name, job.Name)
						return summary
					}
				}
				summary += fmt.Sprintf(" — failed in job \"%s\"", job.Name)
				return summary
			}
		}
	}
	return summary
}

func catchAllFinding(logText string) *Finding {
	lines := strings.Split(logText, "\n")
	var errorLines []string
	
	// Scan the LAST 100 lines for the most relevant error signals
	startIdx := len(lines) - 100
	if startIdx < 0 { startIdx = 0 }
	
	for i := len(lines)-1; i >= startIdx; i-- {
		l := lines[i]
		lower := strings.ToLower(l)
		if strings.Contains(lower, "error") || strings.Contains(lower, "fatal") || strings.Contains(lower, "fail") || strings.Contains(lower, "exit code") {
			errorLines = append([]string{l}, errorLines...) // Prepend for chronological order
			if len(errorLines) >= 10 {
				break
			}
		}
	}

	if len(errorLines) == 0 {
		errorLines = lines[cap(0, len(lines)-5):]
	}

	return &Finding{
		Category:    "Generalized Execution Failure",
		Severity:    "warning",
		Confidence:  0.25,
		Evidence:    errorLines,
		Remediation: "The engine couldn't match a specific known pattern, but the evidence panel above highlights the most suspicious log lines. Suggestion: Look for 'Error' or 'Exit Code' near the end of the log and verify your command's input parameters.",
	}
}

func cap(low, high int) int {
	if low > high { return high }
	return low
}

func firstLineContaining(lines []string, substr string) int {
	for i, l := range lines {
		if strings.Contains(l, substr) {
			return i
		}
	}
	return 0
}

func surroundingLines(lines []string, center, radius int) []string {
	start := center - radius
	end := center + radius
	if start < 0 { start = 0 }
	if end >= len(lines) { end = len(lines) - 1 }
	return lines[start:end+1]
}

func appendUnique(slice []string, s string) []string {
	for _, v := range slice {
		if v == s { return slice }
	}
	if len(slice) < 5 {
		return append(slice, s)
	}
	return slice
}

func truncate(s string, max int) string {
	if len(s) <= max { return s }
	return s[:max] + "..."
}

// ExtractCodeLocation looks for file:line patterns in the log evidence
func ExtractCodeLocation(evidence []string) *CodeLocation {
	// Patterns for Go, Node, Python, Java tracebacks
	// 1. main.go:42
	// 2. /app/src/index.js:15
	// 3. File "app.py", line 123
	patterns := []*regexp.Regexp{
		regexp.MustCompile(`([a-zA-Z0-9_\-\./]+\.(?:go|js|ts|py|java|rb|php|c|cpp|h))[:\s,]+(?:line\s+)?(\d+)`),
	}

	for _, line := range evidence {
		for _, re := range patterns {
			matches := re.FindStringSubmatch(line)
			if len(matches) >= 3 {
				path := matches[1]
				lineNo, _ := strconv.Atoi(matches[2])
				
				// Clean up path (remove leading ./ or workflow-specific paths if possible)
				path = strings.TrimPrefix(path, "./")
				
				return &CodeLocation{
					FilePath: path,
					Line:     lineNo,
				}
			}
		}
	}
	return nil
}
