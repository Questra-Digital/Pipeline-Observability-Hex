package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"time"

	notifications "github.com/QuestraDigital/goServices/Notifications/protos"
	"github.com/nats-io/nats.go"
	"google.golang.org/grpc"
)

const (
	port             = ":50055"
	natsURL          = nats.DefaultURL
	natsSubjectSlack = "observer_slack"
	natsSubjectEmail = "observer_email"
)

var nc *nats.Conn // Global NATS connection variable

// Observer interface defines the contract for all observers
type Observer interface {
	Update(message string)
}

type server struct {
	notifications.UnimplementedNotificationsServer
	eventManager *EventManager
}

// Define EventManager struct
type EventManager struct {
	observers []Observer
}

// Attach a new observer
func (em *EventManager) Attach(observer Observer) {
	em.observers = append(em.observers, observer)
	log.Printf("Observer attached: %T", observer)
}

// Detach an observer
func (em *EventManager) Detach(observer Observer) {
	for i, obs := range em.observers {
		if obs == observer {
			em.observers = append(em.observers[:i], em.observers[i+1:]...)
			log.Printf("Observer detached: %T", observer)
			break
		}
	}
}

// Notify all observers
func (em *EventManager) Notify(eventData string) {
	log.Printf("Notifying %d observers", len(em.observers))
	for _, observer := range em.observers {
		observer.Update(eventData)
	}
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

// Register observers via NATS
func registerObservers(eventManager *EventManager) {
	// Create a subscription for Email service registration
	nc.Subscribe(natsSubjectEmail, func(msg *nats.Msg) {
		log.Println("Email service registered as observer")
		emailObserver := &RemoteObserver{
			observerType: "Email",
			nc:           nc,
			subject:      "email",
		}
		eventManager.Attach(emailObserver)
		// Send acknowledgment
		nc.Publish(msg.Reply, []byte("Email observer registered"))
	})

	// Create a subscription for Slack service registration
	nc.Subscribe(natsSubjectSlack, func(msg *nats.Msg) {
		log.Println("Slack service registered as observer")
		slackObserver := &RemoteObserver{
			observerType: "Slack",
			nc:           nc,
			subject:      "slack",
		}
		eventManager.Attach(slackObserver)
		// Send acknowledgment
		nc.Publish(msg.Reply, []byte("Slack observer registered"))
	})
}

// RemoteObserver implements the Observer interface for remote services
type RemoteObserver struct {
	observerType string
	nc           *nats.Conn
	subject      string
}

func (ro *RemoteObserver) Update(eventData string) {
	log.Printf("Sending notification to %s service: %s", ro.observerType, eventData)
	ro.nc.Publish(ro.subject, []byte(eventData))
}

func (s *server) SendNotification(ctx context.Context, req *notifications.NotificationRequest) (*notifications.NotificationResponse, error) {
	message := req.GetMessage()
	fmt.Printf("Received notification request: Message=%s\n", message)

	// Notify all registered observers
	s.eventManager.Notify(message)

	return &notifications.NotificationResponse{Status: "Notification sent successfully"}, nil
}

func main() {
	// Initialize NATS
	if err := initNATS(); err != nil {
		log.Fatalf("Failed to initialize NATS: %v", err)
	}
	defer nc.Close()

	// Create an EventManager
	eventManager := &EventManager{}

	// Register observers
	registerObservers(eventManager)

	// Wait for services to start and register
	log.Println("Waiting for Email and Slack services to register...")
	time.Sleep(5 * time.Second)

	// Create gRPC server
	s := grpc.NewServer()
	notifications.RegisterNotificationsServer(s, &server{
		eventManager: eventManager,
	})

	// Start listening
	lis, err := net.Listen("tcp", port)
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}
	log.Printf("Server listening on port %s", port)

	// Serve gRPC
	if err := s.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}
