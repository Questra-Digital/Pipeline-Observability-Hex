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

type AIAnalysis struct {
	RootCause       string   `json:"root_cause"`
	Details         string   `json:"details"`
	Countermeasures []string `json:"countermeasures"`
	Severity        string   `json:"severity"`
	FailedJob       string   `json:"failed_job"`
	FailedStep      string   `json:"failed_step"`
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

	// AI-Powered Deep Analysis (Optional)
	AIAnalysis *AIAnalysis `json:"aiAnalysis,omitempty"`
}

// ─────────────────────────────────────────────
// THE RULE LIBRARY
// All 8 categories with weighted patterns + dynamic remediation
// ─────────────────────────────────────────────


// Legacy rule library removed in favor of AI-First RCA.
var ruleLibrary = []Rule{}

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

	// Feature 1+2+8: AI-First RCA
	// Manual scoring logic removed.
	
	result.Summary = "AI analysis processing... Check the Deep-Dive panel below for results."

	// Feature 3: Fingerprinting
	result.Fingerprint = computeFingerprint(logText, repoFullName)

	return result
}


// scoreLog was deprecated in favor of AI analysis.
func scoreLog(logText string) []Finding {
	return []Finding{}
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
// detectLogAnomalies now relies on AI for intelligence-based detection.
func detectLogAnomalies(logText string, run *WorkflowRun) []LogAnomaly {
	return []LogAnomaly{}
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
