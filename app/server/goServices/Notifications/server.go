package main

import (
	"context"
	"fmt"
	"log"
	"net"
	notifications "github.com/QuestraDigital/goServices/Notifications/protos"
	"github.com/QuestraDigital/goServices/Notifications/slackClient"
	"google.golang.org/grpc"
)

const port = ":50055"

type server struct{
	notifications.UnimplementedNotificationsServer
}

func (s *server) SendNotification(ctx context.Context, req *notifications.NotificationRequest) (*notifications.NotificationResponse, error) {
	username := req.GetUsername()
	message := req.GetMessage()

	// Logic to send the notification (replace this with your implementation)
	fmt.Printf("Received notification request: Username=%s, Message=%s\n", username, message)

	// Replace the following line with your Slack API call logic
	// sendNotificationToSlack(username, message)
	slackClient.SendAlert()

	return &notifications.NotificationResponse{Status: "Notification sent successfully"}, nil
}

func(s *server)mustEmbedUnimplementedNotificationsServer(){}

func main() {
	lis, err := net.Listen("tcp", port)
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	s := grpc.NewServer()
	notifications.RegisterNotificationsServer(s, &server{})

	log.Printf("Server listening on port %s", port)
	if err := s.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}
