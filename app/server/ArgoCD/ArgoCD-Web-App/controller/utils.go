package controller

import (
	"log"

	jwt "github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
)

// GetUserEmail extracts the user's email from the JWT claims in the gin context.
func GetUserEmail(c *gin.Context) string {
	claims, exists := c.Get("claims")
	if !exists || claims == nil {
		log.Printf("[GetUserEmail] Claims not found in context for path %s\n", c.Request.URL.Path)
		return ""
	}
	claimsMap, ok := claims.(map[string]interface{})
	if !ok {
		// Try MapClaims (from jwt-go)
		if mapClaims, ok := claims.(jwt.MapClaims); ok {
			email, ok := mapClaims["email"].(string)
			if ok {
				return email
			}
		}
		log.Printf("[GetUserEmail] Failed to cast claims to map for path %s\n", c.Request.URL.Path)
		return ""
	}
	email, ok := claimsMap["email"]
	if !ok {
		log.Printf("[GetUserEmail] Email key missing in claims for path %s\n", c.Request.URL.Path)
		return ""
	}
	emailStr, ok := email.(string)
	if !ok {
		log.Printf("[GetUserEmail] Email value is not string for path %s\n", c.Request.URL.Path)
		return ""
	}
	return emailStr
}
