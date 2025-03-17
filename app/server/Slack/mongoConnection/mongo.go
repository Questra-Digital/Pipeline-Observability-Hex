package mongoconnection

import (
	"context"
	"log"
	"os"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// ConnectToMongoDB establishes a connection to MongoDB and returns the client.
func ConnectToMongoDB() (*mongo.Client, error) {
	// adjust the url, I'm using docker container --> That's why I use 172.24.0.2:27017
	// admin --> DB Name
	// url := "mongodb://mongouser:mongopassword@172.24.0.2:27017/admin"
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatalf("Error loading .env file")
	}
	url := os.Getenv("MONGO_URL")
	clientOptions := options.Client().ApplyURI(url)
	client, err := mongo.Connect(context.TODO(), clientOptions)
	if err != nil {
		return nil, err
	}

	err = client.Ping(context.TODO(), nil)
	if err != nil {
		return nil, err
	}

	log.Println("Connected to MongoDB......")
	return client, nil
}
