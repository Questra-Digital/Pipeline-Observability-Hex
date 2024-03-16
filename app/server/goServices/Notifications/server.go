package main

import (
	"context"
	"fmt"
	"log"
	"net"

	notifications "github.com/QuestraDigital/goServices/Notifications/protos"
	"github.com/nats-io/nats.go"
	"google.golang.org/grpc"
)

const port = ":50055"

type server struct {
	notifications.UnimplementedNotificationsServer
}

// publish message in NATS server
func publishMessage(message string) {
	// Connect to NATS server
	nc, err := nats.Connect(nats.DefaultURL)
	log.Println("NATS URL:", nats.DefaultURL)
	if err != nil {
		log.Fatal(err)
	}
	defer nc.Close()

	err = nc.Publish("slack", []byte(message))
	if err != nil {
		log.Println("Error publishing message:", err)
	} else {
		log.Println("Message published(Slack) successfully....")
	}

	// publish message with subject gmail

	// err = nc.Publish("gmail", []byte(message))
	// if err != nil {
	// 	log.Println("Error publishing message:", err)
	// } else {
	// 	log.Println("Message published(gmail) successfully")
	// }
}

func (s *server) SendNotification(ctx context.Context, req *notifications.NotificationRequest) (*notifications.NotificationResponse, error) {
	message := req.GetMessage()

	fmt.Printf("Received notification request: Message=%s\n", message)
	publishMessage(message)
	return &notifications.NotificationResponse{Status: "Notification sent successfully"}, nil
}

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
