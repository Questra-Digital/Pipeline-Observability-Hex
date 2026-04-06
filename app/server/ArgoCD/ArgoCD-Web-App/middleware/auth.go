package middleware

import (
	"fmt"
	"log"
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
		// jwt from .env file
		err := godotenv.Load(".env")
		if err != nil {
			fmt.Println("Error loading .env: ", err)
		}
		jwtSecret := []byte(os.Getenv("JWT_SECRET"))
		authHeader := c.GetHeader("Authorization")
		tokenString := ""

		if authHeader == "" {
			// Fallback to query parameter for WebSockets
			tokenString = c.Query("token")
			if tokenString == "" {
				log.Printf("[Auth] 401: Missing Authorization header and token query param for path %s\n", c.Request.URL.Path)
				c.JSON(http.StatusUnauthorized, ErrorResponse{"Unauthorized", http.StatusUnauthorized, "Missing Authorization header or token parameter"})
				c.Abort()
				return
			}
		} else {
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
			if tokenString == authHeader {
				log.Printf("[Auth] 401: Invalid header format (missing Bearer prefix) for path %s\n", c.Request.URL.Path)
				c.JSON(http.StatusUnauthorized, ErrorResponse{"Unauthorized", http.StatusUnauthorized, "Invalid Authorization header format"})
				c.Abort()
				return
			}
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("Invalid signing method")
			}
			return jwtSecret, nil
		})

		if err != nil {
			log.Printf("[Auth] 401: JWT Parse Error for path %s: %v\n", c.Request.URL.Path, err)
			c.JSON(http.StatusUnauthorized, ErrorResponse{"Unauthorized", http.StatusUnauthorized, "Invalid or expired token"})
			c.Abort()
			return
		}

		if !token.Valid {
			log.Printf("[Auth] 401: Invalid token for path %s\n", c.Request.URL.Path)
			c.JSON(http.StatusUnauthorized, ErrorResponse{"Unauthorized", http.StatusUnauthorized, "Invalid token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			log.Printf("[Auth] 401: Invalid claims type for path %s\n", c.Request.URL.Path)
			c.JSON(http.StatusUnauthorized, ErrorResponse{"Unauthorized", http.StatusUnauthorized, "Invalid token claims"})
			c.Abort()
			return
		}

		expirationTime, ok := claims["exp"].(float64)
		if !ok {
			log.Printf("[Auth] 401: Missing exp claim for path %s\n", c.Request.URL.Path)
			c.JSON(http.StatusUnauthorized, ErrorResponse{"Unauthorized", http.StatusUnauthorized, "Missing expiration claim"})
			c.Abort()
			return
		}

		if time.Now().Unix() > int64(expirationTime) {
			log.Printf("[Auth] 401: Token expired at %v for path %s\n", time.Unix(int64(expirationTime), 0), c.Request.URL.Path)
			c.JSON(http.StatusUnauthorized, ErrorResponse{"Unauthorized", http.StatusUnauthorized, "Token has expired"})
			c.Abort()
			return
		}

		log.Printf("[Auth] 200: Successfully authenticated path %s for user %v\n", c.Request.URL.Path, claims["email"])
		c.Set("claims", claims)
		c.Next()
	}
}
