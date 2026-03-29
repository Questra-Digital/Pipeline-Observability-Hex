package notificationClient

import (
	"context"
	"log"

	notifications "github.com/QuestraDigital/goServices/GitHub-Sync-Service/notificationClient/protos"
	"google.golang.org/grpc"
)

const (
	address = "localhost:50055"
)

func TriggerNotificationService(customMessage string) {
	// Set up a connection to the server
	conn, err := grpc.Dial(address, grpc.WithInsecure())
	if err != nil {
		log.Printf("ERROR: did not connect to notification service: %v", err)
		return
	}
	defer conn.Close()

	// Create a Notifications client
	client := notifications.NewNotificationsClient(conn)

	// Replace the following lines with your notification data
	// message := "ArgoCD pipeline is out of sync!"
	message := customMessage

	// Send the notification
	response, err := client.SendNotification(context.Background(), &notifications.NotificationRequest{
		Message: message,
	})
	if err != nil {
		log.Printf("ERROR: sending notification failed: %v", err)
		return
	}

	log.Printf("Notification status: %s", response.Status)
}
