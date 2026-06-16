package mongoconnection

import (
	"errors"

	"go.mongodb.org/mongo-driver/mongo"
)

var errClientNotInitialized = errors.New("MongoDB client not initialized: call mongoconnection.Init() from main()")

// ConnectToMongoDB returns the singleton MongoDB client from the pool.
// Init() must be called once from main() before using this.
// NOTE: Callers should NOT disconnect the client. The pool is managed centrally.
func ConnectToMongoDB() (*mongo.Client, error) {
	c := GetClient()
	if c == nil {
		return nil, errClientNotInitialized
	}
	return c, nil
}
