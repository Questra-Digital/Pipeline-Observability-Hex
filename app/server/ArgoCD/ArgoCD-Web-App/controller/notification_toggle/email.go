package notificationtoggle

import (
	"github.com/gin-gonic/gin"
)

// EmailNotificationToggle is the API function for toggling Email notifications
func ReadEmailNotificationStatus(c *gin.Context) {
	ReadNotificationStatus(c, "email")
}

// update the Email notification status
func UpdateEmailNotificationStatus(c *gin.Context) {
	UpdateNotificationStatus(c, "email")
}
