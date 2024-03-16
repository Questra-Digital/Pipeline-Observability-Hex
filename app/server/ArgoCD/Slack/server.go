package main

import (
	"context"
	"log"

	mongoconnection "github.com/QuestraDigital/goServices/Slack/mongoConnection"
	"github.com/nats-io/nats.go"
	"github.com/slack-go/slack"
	"go.mongodb.org/mongo-driver/bson"
)

// send Message to Slack
func sendMessageToSlack(messageText string) error {
	// connect to MongoDB
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		return err
	}
	defer mongoClient.Disconnect(context.TODO())
	// fetch the bot token and channel ID from MongoDB

	collection := mongoClient.Database("admin").Collection("slack")
	var slackData map[string]string
	err = collection.FindOne(context.TODO(), bson.D{}).Decode(&slackData)
	if err != nil {
		return err
	}
	botToken := slackData["token"]
	channelID := slackData["channel"]

	api := slack.New(botToken)
	message := slack.MsgOptionText(messageText, false)
	channel, timestamp, err := api.PostMessage(channelID, message)
	if err != nil {
		return err
	}

	log.Printf("Message sent to channel %s at %s", channel, timestamp)
	return nil
}

func main() {
	// Connect to NATS server
	nc, err := nats.Connect(nats.DefaultURL)
	if err != nil {
		log.Fatal(err)
	}
	defer nc.Close()

	// Subscribe to a slack subject
	nc.Subscribe("slack", func(msg *nats.Msg) {
		log.Printf("Received message: %s\n", string(msg.Data))
		err := sendMessageToSlack(string(msg.Data))
		if err != nil {
			log.Println("Error sending message to Slack:", err)
		}
	})

	// Keep the subscriber running
	select {}
}
