package main

import (
	"context"
	"log"
	"myginapp/graph"
	"net/http"
	"os"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const defaultPort = "8000"

func main() {
	// Initialize Gin router
	r := gin.Default()

	// ----------------------- Routes -------------------------------
	// Define a route to handle GET requests to the root endpoint "/"
	r.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "Hello, this is your Gin route!")
	})

	// Connect to MongoDB
	clientOptions := options.Client().ApplyURI("mongodb://mongouser:mongopassword@172.24.0.2:27017/admin") // Replace with your MongoDB connection URI
	client, err := mongo.Connect(context.TODO(), clientOptions)
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}

	// Check the connection
	err = client.Ping(context.TODO(), nil)
	if err != nil {
		log.Fatalf("Failed to ping MongoDB: %v", err)
	}

	// Log a message indicating a successful MongoDB connection
	log.Println("Connected to MongoDB")

	// Close the MongoDB client when the application exits
	defer func() {
		if err := client.Disconnect(context.TODO()); err != nil {
			log.Fatalf("Failed to disconnect from MongoDB: %v", err)
		}
	}()

	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	// Create a new Resolver with the MongoDB client
	resolver := &graph.Resolver{
		// Pass the MongoDB client to the Resolver
		// You can now use this client in your Resolver functions to interact with MongoDB.
		MongoDB: client,
	}

	// Create the GraphQL server with the Resolver
	srv := handler.NewDefaultServer(graph.NewExecutableSchema(graph.Config{Resolvers: resolver}))

	// Add GraphQL playground route
	r.GET("/playground", func(c *gin.Context) {
		playground.Handler("GraphQL playground", "/query").ServeHTTP(c.Writer, c.Request)
	})

	// Add GraphQL query route
	r.POST("/query", func(c *gin.Context) {
		srv.ServeHTTP(c.Writer, c.Request)
	})

	// Start the Gin server
	log.Printf("Connect to http://localhost:%s/ for GraphQL playground", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
