package controller

import (
	"fmt"

	jwt "github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
)

func ChangePassword(c *gin.Context) {
	var passwordCredentials map[string]string
	if err := c.BindJSON(&passwordCredentials); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request body"})
		return
	}
	newPassword := passwordCredentials["newPassword"]
	if claims, ok := c.Get("claims"); ok {
		// Use the email value here
		if jwtClaims, ok := claims.(jwt.MapClaims); ok {
			email := jwtClaims["email"].(string)
			fmt.Println("Email: ", email, " | New Password: ", newPassword)
			if err := UpdatePassword(email, newPassword); err != nil {
				c.JSON(500, gin.H{"error": "Internal server error"})
				return
			}
		}
	} else {
		c.JSON(500, gin.H{"error": "Internal server error"})
		return
	}
	c.JSON(200, gin.H{"message": "Password updated successfully"})
}
