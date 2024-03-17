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

const (
	port             = ":50055"
	natsURL          = nats.DefaultURL
	natsSubjectSlack = "slack"
	natsSubjectEmail = "email"
)

var nc *nats.Conn // Global NATS connection variable

type server struct {
	notifications.UnimplementedNotificationsServer
}

// Initialize NATS connection
func initNATS() error {
	var err error
	nc, err = nats.Connect(natsURL)
	if err != nil {
		return fmt.Errorf("failed to connect to NATS server: %v", err)
	}
	log.Println("Connected to NATS server:", natsURL)
	return nil
}

// publish message in NATS server
func publishMessage(subject, message string) {
	if nc == nil {
		log.Println("NATS connection is not initialized")
		return
	}

	err := nc.Publish(subject, []byte(message))
	if err != nil {
		log.Printf("Error publishing message on subject %s: %v", subject, err)
	} else {
		log.Printf("Message published (%s) successfully", subject)
	}
}

func (s *server) SendNotification(ctx context.Context, req *notifications.NotificationRequest) (*notifications.NotificationResponse, error) {
	message := req.GetMessage()

	fmt.Printf("Received notification request: Message=%s\n", message)
	publishMessage(natsSubjectSlack, message)
	publishMessage(natsSubjectEmail, message)

	return &notifications.NotificationResponse{Status: "Notification sent successfully"}, nil
}

func main() {
	if err := initNATS(); err != nil {
		log.Fatalf("Failed to initialize NATS: %v", err)
	}
	defer nc.Close() // Close the NATS connection when the program exits

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
