package github

import (
	"context"
	"net/http"

	"github.com/QuestraDigital/goServices/ArgoCD-Web-App/controller"
	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Web-App/mongoConnection"
	"github.com/gin-gonic/gin"
	"github.com/google/go-github/v60/github"
	"go.mongodb.org/mongo-driver/bson"
	mongoOptions "go.mongodb.org/mongo-driver/mongo/options"
)

// SyncTickets reconciles all open/escalated tickets in MongoDB with their current
// state on GitHub (closed, deleted, still open).  It is called on-demand by the
// frontend when the Tickets page or Watchdog tab loads, so the user always sees
// up-to-date status without any background polling.
//
// GET /api/github/tickets/sync
func SyncTickets(c *gin.Context) {
	userEmail := controller.GetUserEmail(c)
	if userEmail == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection error"})
		return
	}
	defer mongoClient.Disconnect(context.TODO())

	db := mongoClient.Database("admin")
	issuesColl := db.Collection("github_issues")
	accountsColl := db.Collection("github_accounts")

	// ── 1. Load all connected GitHub accounts for this user ──────────────
	// We build two lookup structures:
	//   ownerMap: repoOwner → first matching GitHub client  (fast path)
	//   fallback: first available client for org-owned repos (fallback)
	var accounts []GitHubAccount
	accCursor, err := accountsColl.Find(context.TODO(), bson.M{"userId": userEmail})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch accounts"})
		return
	}
	_ = accCursor.All(context.TODO(), &accounts)

	ownerMap := make(map[string]*github.Client, len(accounts))
	var fallbackClient *github.Client
	for _, acc := range accounts {
		cl := github.NewClient(nil).WithAuthToken(acc.PAT)
		ownerMap[acc.Owner] = cl
		if fallbackClient == nil {
			fallbackClient = cl
		}
	}

	if fallbackClient == nil {
		// No GitHub accounts connected — return current tickets as-is.
		opts := mongoOptions.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})
		cur, err := issuesColl.Find(context.TODO(), bson.M{"status": bson.M{"$ne": "deleted"}}, opts)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tickets"})
			return
		}
		var all []Ticket
		_ = cur.All(context.TODO(), &all)
		if all == nil {
			all = []Ticket{}
		}
		c.JSON(http.StatusOK, gin.H{"tickets": all, "synced": 0})
		return
	}

	// ── 2. Fetch only tickets that could have changed (open / escalated) ──
	pendingCursor, err := issuesColl.Find(
		context.TODO(),
		bson.M{"status": bson.M{"$in": []string{"open", "escalated"}}},
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query tickets"})
		return
	}
	var pending []Ticket
	_ = pendingCursor.All(context.TODO(), &pending)

	// ── 3. For each pending ticket, ask GitHub for the current state ──────
	synced := 0
	for _, ticket := range pending {
		// Pick the best client: direct owner match → fallback
		cl, ok := ownerMap[ticket.RepoOwner]
		if !ok {
			cl = fallbackClient
		}

		ghIssue, resp, err := cl.Issues.Get(
			context.TODO(),
			ticket.RepoOwner,
			ticket.RepoName,
			ticket.IssueNumber,
		)

		var newStatus string
		if err != nil {
			if resp != nil && (resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusGone) {
				// Issue was deleted on GitHub (404 Not Found or 410 Gone)
				newStatus = "deleted"
			} else {
				// API error (rate limit, network) — leave this ticket alone
				continue
			}
		} else {
			// GitHub returns "open" or "closed"
			newStatus = ghIssue.GetState()
		}

		// Only write to MongoDB if something actually changed
		if newStatus != "" && newStatus != ticket.Status {
			_, _ = issuesColl.UpdateOne(
				context.TODO(),
				bson.M{"_id": ticket.ID},
				bson.M{"$set": bson.M{"status": newStatus}},
			)
			synced++
		}
	}

	// ── 4. Return the full refreshed list + how many were updated ─────────
	opts := mongoOptions.Find().SetSort(bson.D{{Key: "createdAt", Value: -1}})
	cursor, err := issuesColl.Find(context.TODO(), bson.M{"status": bson.M{"$ne": "deleted"}}, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated tickets"})
		return
	}
	var allTickets []Ticket
	if err = cursor.All(context.TODO(), &allTickets); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error decoding tickets"})
		return
	}
	if allTickets == nil {
		allTickets = []Ticket{}
	}

	c.JSON(http.StatusOK, gin.H{
		"tickets": allTickets,
		"synced":  synced,
	})
}

