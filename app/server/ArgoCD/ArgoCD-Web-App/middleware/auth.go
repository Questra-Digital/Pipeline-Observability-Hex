package middleware

import (
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	jwt "github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

// ErrorResponse is a struct for representing error responses
type ErrorResponse struct {
	Error   string `json:"error"`
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		// Extract the token from the Authorization header
		// jwt from .env file
		err := godotenv.Load(".env")
		if err != nil {
			fmt.Println("Error: ", err)
			return
		}
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

		// Check token expiration
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, ErrorResponse{"Unauthorized", http.StatusUnauthorized, "Invalid token claims"})
			c.Abort()
			return
		}

		expirationTime := int64(claims["exp"].(float64))
		if time.Now().Unix() > expirationTime {
			c.JSON(http.StatusUnauthorized, ErrorResponse{"Unauthorized", http.StatusUnauthorized, "Token has expired"})
			c.Abort()
			return
		}

		// Add the claims to the context for further use
		// claims = token.Claims.(jwt.MapClaims)
		c.Set("claims", claims)
		c.Next()
	}
}
