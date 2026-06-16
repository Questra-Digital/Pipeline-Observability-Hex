package main

import (
	"context"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	notifications "github.com/QuestraDigital/goServices/Notifications/protos"
	"github.com/joho/godotenv"
	"github.com/nats-io/nats.go"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/credentials/insecure"
)

const (
	natsSubjectSlack = "slack"
	natsSubjectEmail = "email"
)

func getPort() string {
	port := os.Getenv("NOTIFICATIONS_PORT")
	if port == "" {
		port = ":50055"
	}
	return port
}

func getNATSURL() string {
	url := os.Getenv("NATS_URL")
	if url == "" {
		url = nats.DefaultURL
	}
	return url
}

type server struct {
	notifications.UnimplementedNotificationsServer
}

func publishMessage(nc *nats.Conn, subject, message string) {
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

	log.Printf("Received notification request: Message=%s", message)
	publishMessage(nc, natsSubjectSlack, message)
	publishMessage(nc, natsSubjectEmail, message)

	return &notifications.NotificationResponse{Status: "Notification sent successfully"}, nil
}

var nc *nats.Conn

func main() {
	_ = godotenv.Load(".env")

	var err error
	nc, err = nats.Connect(getNATSURL(), nats.RetryOnFailedConnect(true), nats.MaxReconnects(-1))
	if err != nil {
		log.Fatalf("Failed to connect to NATS: %v", err)
	}
	defer nc.Close()
	log.Println("Connected to NATS server:", getNATSURL())

	lis, err := net.Listen("tcp", getPort())
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	var opts []grpc.ServerOption
	tlsCertFile := os.Getenv("TLS_CERT_FILE")
	tlsKeyFile := os.Getenv("TLS_KEY_FILE")
	if tlsCertFile != "" && tlsKeyFile != "" {
		creds, err := credentials.NewServerTLSFromFile(tlsCertFile, tlsKeyFile)
		if err != nil {
			log.Fatalf("Failed to load TLS credentials: %v", err)
		}
		opts = append(opts, grpc.Creds(creds))
		log.Println("gRPC server using TLS")
	} else {
		opts = append(opts, grpc.Creds(insecure.NewCredentials()))
		log.Println("gRPC server using insecure credentials")
	}

	s := grpc.NewServer(opts...)
	notifications.RegisterNotificationsServer(s, &server{})
	log.Printf("Server listening on port %s", getPort())

	go func() {
		if err := s.Serve(lis); err != nil {
			log.Fatalf("Failed to serve: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down Notifications service...")
	s.GracefulStop()
	nc.Drain()
}
