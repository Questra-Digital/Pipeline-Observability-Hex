package slackClient

import (
	"context"
	"log"
	"google.golang.org/grpc"
	"github.com/QuestraDigital/goServices/Notifications/slackClient/protos"
)


func SendAlert() {
	// Set the address of the gRPC server
	serverAddr := "localhost:50051"
	log.Println("Send Alert Called!")
	// Connect to the gRPC server
	conn, err := grpc.Dial(serverAddr, grpc.WithInsecure())
	if err != nil {
		log.Fatalf("Failed to connect to the server: %v", err)
	}
	defer conn.Close()

	// Create a gRPC client
	client := protos.NewSlackServiceClient(conn)

	// Replace these values with your actual Slack bot token, channel ID, and message text
	botToken := "xoxb-6246363538144-6208982571575-sQcKHW28meqt0bujxwe4SrSs"
	channelID := "C0664RSD6KZ"
	messageText := "ArgoCD Pipeline Got Out Of Sync!"

	// Prepare the gRPC request
	request := &protos.SlackMessageRequest{
		BotToken:   botToken,
		ChannelId:  channelID,
		MessageText: messageText,
	}

	// Call the SendMessage gRPC method
	response, err := client.SendMessage(context.Background(), request)
	if err != nil {
		log.Fatalf("Error calling SendMessage: %v", err)
	}

	// Check the response from the server
	if response.Success {
		log.Println("Message sent successfully!")
	} else {
		log.Printf("Failed to send message. Error: %s\n", response.ErrorMessage)
	}
}
