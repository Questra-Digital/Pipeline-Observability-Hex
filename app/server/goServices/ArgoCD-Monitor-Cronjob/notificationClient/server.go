package notificationClient

import (
	"context"
	"log"
	notifications "github.com/QuestraDigital/goServices/ArgoCD-Monitor-Cronjob/notificationClient/protos"
	"google.golang.org/grpc"
)

const (
	address = "localhost:50055"
)

func TriggerNotificationService() {
	// Set up a connection to the server
	conn, err := grpc.Dial(address, grpc.WithInsecure())
	if err != nil {
		log.Fatalf("did not connect: %v", err)
	}
	defer conn.Close()

	// Create a Notifications client
	client := notifications.NewNotificationsClient(conn)

	// Replace the following lines with your notification data
	username := "ranaadil571@gmail.com"
	message := "ArgoCD pipeline is out of sync!"

	// Send the notification
	response, err := client.SendNotification(context.Background(), &notifications.NotificationRequest{
		Username: username,
		Message:  message,
	})
	if err != nil {
		log.Fatalf("Error sending notification: %v", err)
	}

	log.Printf("Notification status: %s", response.Status)
}
