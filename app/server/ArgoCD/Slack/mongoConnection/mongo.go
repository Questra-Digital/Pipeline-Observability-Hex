package mongoconnection

import (
	"go.mongodb.org/mongo-driver/mongo"
)

func ConnectToMongoDB() (*mongo.Client, error) {
	Init()
	if initErr != nil {
		return nil, initErr
	}
	return clientInstance, nil
}
