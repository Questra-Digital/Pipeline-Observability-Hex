package graph

import (
	"go.mongodb.org/mongo-driver/mongo"
)

// It serves as dependency injection for your app, add any dependencies you require here.
type Resolver struct {
	MongoDB *mongo.Client // Add the MongoDB client field here
}

// NewResolver creates a new Resolver instance with injected dependencies.
func NewResolver(client *mongo.Client) *Resolver {
	return &Resolver{
		MongoDB: client, // Initialize the MongoDB client field
	}
}
