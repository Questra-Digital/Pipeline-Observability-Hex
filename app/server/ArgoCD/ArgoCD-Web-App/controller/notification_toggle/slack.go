package notificationtoggle

import (
	"github.com/gin-gonic/gin"
)

// SlackNotificationToggle is the API function for toggling slack notifications
func ReadSlackNotificationStatus(c *gin.Context) {
	ReadNotificationStatus(c, "slack")
}

// update the slack notification status
func UpdateSlackNotificationStatus(c *gin.Context) {
	UpdateNotificationStatus(c, "slack")
}
