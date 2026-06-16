package mongoconnection

import (
	"context"
	"log"
	"os"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	clientInstance *mongo.Client
	clientOnce     sync.Once
	initErr        error
)

func Init() {
	clientOnce.Do(func() {
		url := os.Getenv("MONGO_URL")
		if url == "" {
			url = "mongodb://localhost:27017/admin"
		}

		opts := options.Client().ApplyURI(url).
			SetMinPoolSize(5).
			SetMaxPoolSize(20).
			SetMaxConnIdleTime(30 * time.Second)

		clientInstance, initErr = mongo.Connect(context.Background(), opts)
		if initErr != nil {
			log.Printf("MongoDB Init error: %v", initErr)
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		initErr = clientInstance.Ping(ctx, nil)
		if initErr != nil {
			log.Printf("MongoDB Ping error: %v", initErr)
			return
		}

		log.Println("MongoDB connection pool initialized")
	})
}

func GetClient() *mongo.Client {
	return clientInstance
}

func Close() {
	if clientInstance != nil {
		_ = clientInstance.Disconnect(context.Background())
	}
}
