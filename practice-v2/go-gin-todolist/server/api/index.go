package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Todo struct {
	ID        primitive.ObjectID `json:"_id,omitempty" bson:"_id,omitempty"`
	Completed bool               `json:"completed"`
	Body      string             `json:"body"`
}

var (
	app        *gin.Engine
	collection *mongo.Collection
)

func main() {
	if os.Getenv("ENV") != "production" {
		err := godotenv.Load("../.env")
		if err != nil {
			log.Fatal("Error loading .env file: ", err)
		}
	}

	MONGODB_URI := os.Getenv("MONGODB_URI")
	clientOptions := options.Client().ApplyURI(MONGODB_URI)
	client, err := mongo.Connect(context.Background(), clientOptions)

	if err != nil {
		log.Fatal(err)
	}

	defer client.Disconnect(context.Background())

	err = client.Ping(context.Background(), nil)

	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Connected to MongoDB!")

	collection = client.Database("react-go-tutorial").Collection("todos")

	app = gin.New()

	app.Use(cors.New(cors.Config{
		AllowOrigins: []string{"https://go-todo-list.vercel.app", "https://go-todolist.vercel.app", "http://localhost:5173"},
		AllowHeaders: []string{"Origin", "Content-Type", "Accept"},
		AllowMethods: []string{"GET", "POST", "PATCH", "DELETE"},
	}))

	app.GET("/api/todos", getTodos)
	app.POST("/api/todos", createTodo)
	app.PATCH("/api/todos/:id", updateTodo)
	app.DELETE("/api/todos/:id", deleteTodo)

	port := os.Getenv("PORT")
	if port == "" {
		port = "5176"
	}

	log.Fatal(app.Run(":" + port))
}

// func Handler(w http.ResponseWriter, r *http.Request) {
// 	app.ServeHTTP(w, r)
// }
