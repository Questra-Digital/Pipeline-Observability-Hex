package github

import (
	"crypto/md5"
	"fmt"
	"math"
	"regexp"
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
	Evidence     []string `json:"evidence"`   // 10-line context (Feature 2)
	Remediation  string   `json:"remediation"`
	MatchedLines []string `json:"matchedLines"`
	Weight       float64  `json:"-"` // internal accumulator
	Count        int      `json:"-"` // matches found
}

// Feature 7: Anomaly flags detected inside log
type LogAnomaly struct {
	Type        string `json:"type"`
	Description string `json:"description"`
	Severity    string `json:"severity"`
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
		Weight:   0.80,
		Category: "Missing ENV Variable / Secret",
		Severity: "critical",
		Remediation: func(match, log string) string {
			// Extract the variable name from the match
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
	{
		Pattern:  regexp.MustCompile(`(?i)secret.*not found|secrets\.get.*none|secret_key.*empty|api[_-]?key.*undefined`),
		Weight:   0.70,
		Category: "Missing ENV Variable / Secret",
		Severity: "critical",
		Remediation: func(match, log string) string {
			return "A required secret is not configured. Go to repository Settings → Secrets and Variables → Actions and add the missing API key or secret."
		},
	},

	// ── DEPENDENCY FAILURE ──
	{
		Pattern:  regexp.MustCompile(`(?i)npm\s+err!|npm\s+error|cannot find module|module not found|err_module_not_found|no module named|importerror.*no module|cannot find package|go: module|ModuleNotFoundError|pip install.*failed|failed to resolve`),
		Weight:   0.80,
		Category: "Dependency Failure",
		Severity: "critical",
		Remediation: func(match, log string) string {
			// npm: extract package name
			npmRe := regexp.MustCompile(`(?i)cannot find module ['"]([^'"]+)['"]|module not found.*['"]([^'"]+)['"]`)
			if m := npmRe.FindStringSubmatch(match); m != nil {
				pkg := m[1]
				if pkg == "" { pkg = m[2] }
				if pkg != "" {
					return fmt.Sprintf("Install the missing package: `npm install %s` and commit the updated `package.json` / `package-lock.json`.", pkg)
				}
			}
			// Python: extract package name
			pyRe := regexp.MustCompile(`(?i)no module named ['"]?([a-z_\-]+)['"]?`)
			if m := pyRe.FindStringSubmatch(match); m != nil {
				return fmt.Sprintf("Install the missing Python package: `pip install %s` and add it to `requirements.txt`.", m[1])
			}
			// Go: extract module
			goRe := regexp.MustCompile(`(?i)cannot find package ([^\s]+)`)
			if m := goRe.FindStringSubmatch(match); m != nil {
				return fmt.Sprintf("Run `go get %s` to install the missing Go package.", m[1])
			}
			return "A dependency could not be resolved. Run your package manager install command (`npm install`, `pip install -r requirements.txt`, `go mod tidy`) and ensure `lock` files are committed."
		},
	},
	{
		Pattern:  regexp.MustCompile(`(?i)lock\s*file.*outdated|package\.json.*mismatch|yarn\.lock.*conflict|composer\.lock.*conflict`),
		Weight:   0.50,
		Category: "Dependency Failure",
		Severity: "warning",
		Remediation: func(match, log string) string {
			return "Your lock file is out of sync with your manifest. Delete `package-lock.json` / `yarn.lock` and re-run `npm install` or `yarn install`, then commit the updated lock file."
		},
	},

	// ── PERMISSION / AUTH ──
	{
		Pattern:  regexp.MustCompile(`(?i)permission denied|EACCES|EPERM|403\s+forbidden|401\s+unauthorized|authentication\s+failed|auth\s+error|access\s+denied|you\s+don.t\s+have\s+access|insufficient\s+permissions`),
		Weight:   0.75,
		Category: "Permission / Authentication Error",
		Severity: "critical",
		Remediation: func(match, log string) string {
			if strings.Contains(strings.ToLower(match), "permission denied") || strings.Contains(strings.ToLower(match), "eacces") {
				return "File system permission error. Ensure the workflow runner has write access to the target directory, or prefix the command with `sudo` if appropriate. Check file ownership in your Dockerfile or runner environment."
			}
			if strings.Contains(match, "403") || strings.Contains(strings.ToLower(match), "access denied") {
				return "API/resource access denied (403). Verify the token/API key has the required scopes. For GitHub Actions, ensure `permissions:` in your workflow YAML includes the necessary access levels."
			}
			return "Authentication failure. Verify that your credentials (token, SSH key, PAT) are valid, not expired, and have the required permissions."
		},
	},

	// ── TIMEOUT ──
	{
		Pattern:  regexp.MustCompile(`(?i)timed?\s*out|ETIMEDOUT|context\s+deadline\s+exceeded|canceling.*context|operation\s+timed\s+out|read\s+timeout|connection\s+timed\s+out|execution\s+time\s+exceeded|err_socket_timeout`),
		Weight:   0.70,
		Category: "Timeout",
		Severity: "warning",
		Remediation: func(match, log string) string {
			return "A step exceeded its time limit. Options: (1) Add `timeout-minutes:` to the specific step in your YAML to increase the limit. (2) Optimize the slow operation. (3) Check for network connectivity issues causing the step to hang. (4) Use caching for slow dependency downloads."
		},
	},

	// ── OOM / RESOURCE ──
	{
		Pattern:  regexp.MustCompile(`(?i)killed\s|out\s+of\s+memory|OOMKilled|cannot allocate memory|javascript\s+heap\s+out\s+of\s+memory|MemoryError|heap space|allocation\s+failed.*out\s+of\s+memory`),
		Weight:   0.85,
		Category: "Out of Memory",
		Severity: "critical",
		Remediation: func(match, log string) string {
			if strings.Contains(strings.ToLower(match), "javascript heap") || strings.Contains(strings.ToLower(match), "heap space") {
				return "Node.js ran out of heap memory. Increase the heap size: `NODE_OPTIONS=--max-old-space-size=4096 npm run build`. For GitHub Actions, this goes in the `env:` block of your step."
			}
			return "The process was killed due to insufficient memory. Upgrade the runner size, or optimize memory usage in your build. For Node.js: set `NODE_OPTIONS=--max-old-space-size=4096`. For Java: adjust `-Xmx` flag."
		},
	},

	// ── NETWORK ──
	{
		Pattern:  regexp.MustCompile(`(?i)ECONNREFUSED|ECONNRESET|ENOTFOUND|dial\s+tcp.*i\/o\s+timeout|no\s+such\s+host|network\s+error|connection\s+refused|connection\s+reset|getaddrinfo\s+failed|failed\s+to\s+connect`),
		Weight:   0.65,
		Category: "Network Error",
		Severity: "warning",
		Remediation: func(match, log string) string {
			return "A network connection failed. This can be transient — retry the workflow. If persistent: (1) Verify the target hostname/IP is correct. (2) Check if the service is behind a firewall. (3) For private services, ensure you're using VPN or SSH tunneling in the runner."
		},
	},

	// ── DOCKER ──
	{
		Pattern:  regexp.MustCompile(`(?i)cannot\s+connect\s+to\s+the\s+docker\s+daemon|docker:\s+error|pull\s+access\s+denied|manifest\s+unknown|no\s+such\s+image|docker\s+build.*failed|failed\s+to\s+create\s+.*container`),
		Weight:   0.70,
		Category: "Docker / Container Error",
		Severity: "critical",
		Remediation: func(match, log string) string {
			if strings.Contains(strings.ToLower(match), "pull access denied") {
				return "Image pull failed. Ensure the image name/tag is correct, the image is public, or you've logged in with `docker login` as a step in your workflow using stored credentials."
			}
			if strings.Contains(strings.ToLower(match), "cannot connect to the docker daemon") {
				return "Docker daemon is not running on the runner. Add `services: docker: image: docker:dind` or ensure your runner has Docker access. For self-hosted runners, start the Docker daemon."
			}
			return "Docker build/run failed. Check image tags, registry credentials, and Dockerfile syntax. Verify the Docker daemon is accessible in your CI environment."
		},
	},

	// ── TEST FAILURE ──
	{
		Pattern:  regexp.MustCompile(`(?i)FAIL\t|--- FAIL|test\s+failed|tests?\s+failed|assertion\s+failed|AssertionError|expected\s+.*\s+to\s+(equal|be|match)|jest.*failed|pytest.*failed|❌\s+\w|\d+\s+failing`),
		Weight:   0.60,
		Category: "Test Failure",
		Severity: "warning",
		Remediation: func(match, log string) string {
			return "One or more tests failed. Run the tests locally with the same environment variables to reproduce. Check assertion errors in the evidence section above — they contain the exact expected vs actual values."
		},
	},

	// ── SYNTAX / COMPILE ──
	{
		Pattern:  regexp.MustCompile(`(?i)SyntaxError|IndentationError|compilation\s+failed|build\s+failed|error\s+TS\d+|cannot\s+compile|exit\s+code\s+[1-9]|exit\s+status\s+[1-9]|process\s+exited\s+with\s+code\s+[1-9]`),
		Weight:   0.50,
		Category: "Build / Compile Error",
		Severity: "critical",
		Remediation: func(match, log string) string {
			if strings.Contains(strings.ToLower(match), "syntaxerror") {
				return "Syntax error in your code. Check the file and line number in the log above. Run a local lint/compile check before pushing: `npm run lint`, `tsc --noEmit`, `go vet ./...`."
			}
			if strings.Contains(match, "TS") {
				return "TypeScript compilation error. Check the error code in the evidence. Run `tsc --noEmit` locally to see all errors."
			}
			return "The build process failed. Review the error message in the evidence panel to identify the exact file and line. Ensure your build command runs successfully in a clean local environment."
		},
	},

	// ── RUNNER / CONFIGURATION ──
	{
		Pattern:  regexp.MustCompile(`(?i)no\s+runner\s+is\s+registered|runner\s+offline|self.hosted.*offline|unable\s+to\s+find\s+a\s+suitable\s+runner|workflow\s+is\s+not\s+valid|invalid\s+workflow\s+file|yaml.*invalid|unexpected\s+value`),
		Weight:   0.75,
		Category: "Runner / Workflow Configuration Error",
		Severity: "critical",
		Remediation: func(match, log string) string {
			if strings.Contains(strings.ToLower(match), "runner") {
				return "No GitHub Actions runner is available. For GitHub-hosted runners, check GitHub Status at githubstatus.com. For self-hosted runners, ensure the runner process is started and registered."
			}
			return "Your workflow YAML file has a syntax or configuration error. Validate it at https://rhymond.github.io/yaml-lint/ or use the GitHub Actions workflow editor which has inline validation."
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
	for _, l := range lines {
		lower := strings.ToLower(l)
		if strings.Contains(lower, "error") || strings.Contains(lower, "fatal") || strings.Contains(lower, "fail") {
			errorLines = append(errorLines, l)
			if len(errorLines) >= 10 {
				break
			}
		}
	}
	return &Finding{
		Category:    "Unknown Error",
		Severity:    "warning",
		Confidence:  0.30,
		Evidence:    errorLines,
		Remediation: "No specific pattern matched. Review the error lines in the evidence panel. Search for the exact error message on GitHub Issues or Stack Overflow.",
	}
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
