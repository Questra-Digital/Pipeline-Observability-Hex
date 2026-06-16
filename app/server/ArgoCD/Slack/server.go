package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	mongoconnection "github.com/QuestraDigital/goServices/Slack/mongoConnection"
	"github.com/joho/godotenv"
	"github.com/nats-io/nats.go"
	"github.com/slack-go/slack"
	"go.mongodb.org/mongo-driver/bson"
)

func getNATSURL() string {
	url := os.Getenv("NATS_URL")
	if url == "" {
		url = nats.DefaultURL
	}
	return url
}

func isNotificationEnabled() (bool, error) {
	client := mongoconnection.GetClient()
	if client == nil {
		return false, nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	collection := client.Database("notification").Collection("slack")
	var notificationData map[string]string
	err := collection.FindOne(ctx, bson.D{}).Decode(&notificationData)
	if err != nil {
		return false, err
	}
	return notificationData["status"] == "on", nil
}

func sendMessageToSlack(messageText string) error {
	if enabled, err := isNotificationEnabled(); err != nil {
		log.Println("Error checking notification status:", err)
		return err
	} else if !enabled {
		log.Println("Notification is disabled")
		return nil
	}

	client := mongoconnection.GetClient()
	if client == nil {
		return nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	collection := client.Database("admin").Collection("slack")
	var slackData map[string]string
	err := collection.FindOne(ctx, bson.D{}).Decode(&slackData)
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
	_ = godotenv.Load(".env")

	mongoconnection.Init()

	nc, err := nats.Connect(getNATSURL(), nats.RetryOnFailedConnect(true), nats.MaxReconnects(-1))
	if err != nil {
		log.Fatal(err)
	}
	defer nc.Close()

	nc.Subscribe("slack", func(msg *nats.Msg) {
		err := sendMessageToSlack(string(msg.Data))
		if err != nil {
			log.Println("Error sending message to Slack:", err)
		}
	})

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down Slack service...")
	nc.Drain()
	mongoconnection.Close()
}
