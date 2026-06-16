package mongoconnection

import (
	"context"
	"log"
	"os"
	"sync"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	client *mongo.Client
	once   sync.Once
	initErr error
)

// Init initializes the MongoDB connection pool once at startup.
// Must be called from main() before any controller uses the database.
func Init() error {
	once.Do(func() {
		_ = godotenv.Load(".env")
		url := os.Getenv("MONGO_URL")
		if url == "" {
			url = "mongodb://localhost:27017"
		}

		clientOptions := options.Client().ApplyURI(url).
			SetMinPoolSize(5).
			SetMaxPoolSize(20).
			SetMaxConnIdleTime(30 * time.Second)

		client, initErr = mongo.Connect(context.Background(), clientOptions)
		if initErr != nil {
			return
		}

		initErr = client.Ping(context.Background(), nil)
		if initErr == nil {
			log.Println("[MongoDB] Connection pool established")
		}
	})
	return initErr
}

// GetClient returns the singleton MongoDB client. Init() must be called first.
func GetClient() *mongo.Client {
	return client
}

// Close disconnects the MongoDB client gracefully.
func Close() {
	if client != nil {
		_ = client.Disconnect(context.Background())
		log.Println("[MongoDB] Connection pool closed")
	}
}
