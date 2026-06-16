package middleware

import (
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	jwt "github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
)

var (
	jwtSecretOnce sync.Once
	jwtSecret     []byte
)

func getJWTSecret() []byte {
	jwtSecretOnce.Do(func() {
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			log.Fatal("[FATAL] JWT_SECRET environment variable is not set")
		}
		jwtSecret = []byte(secret)
	})
	return jwtSecret
}

type ErrorResponse struct {
	Error   string `json:"error"`
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func AuthMiddleware() gin.HandlerFunc {
	secret := getJWTSecret()
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		tokenString := ""

		if authHeader == "" {
			tokenString = c.Query("token")
			if tokenString == "" {
				c.JSON(http.StatusUnauthorized, ErrorResponse{"Unauthorized", http.StatusUnauthorized, "Missing Authorization header or token parameter"})
				c.Abort()
				return
			}
		} else {
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
			if tokenString == authHeader {
				c.JSON(http.StatusUnauthorized, ErrorResponse{"Unauthorized", http.StatusUnauthorized, "Invalid Authorization header format"})
				c.Abort()
				return
			}
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return secret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, ErrorResponse{"Unauthorized", http.StatusUnauthorized, "Invalid or expired token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, ErrorResponse{"Unauthorized", http.StatusUnauthorized, "Invalid token claims"})
			c.Abort()
			return
		}

		expirationTime, ok := claims["exp"].(float64)
		if !ok || time.Now().Unix() > int64(expirationTime) {
			c.JSON(http.StatusUnauthorized, ErrorResponse{"Unauthorized", http.StatusUnauthorized, "Token has expired"})
			c.Abort()
			return
		}

		c.Set("claims", claims)
		c.Next()
	}
}
