package middleware

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	jwt "github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
)

// ErrorResponse is a struct for representing error responses
type ErrorResponse struct {
	Error   string `json:"error"`
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract the token from the Authorization header
		// jwt from .env file
		jwtSecret := []byte(os.Getenv("JWT_SECRET"))
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, ErrorResponse{"Unauthorized", http.StatusUnauthorized, "Missing Authorization header"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Validate the signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("Invalid signing method")
			}
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, ErrorResponse{"Unauthorized", http.StatusUnauthorized, "Invalid or expired token"})
			c.Abort()
			return
		}

		// Add the claims to the context for further use
		claims := token.Claims.(jwt.MapClaims)
		c.Set("claims", claims)
		c.Next()
	}
}
