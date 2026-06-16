package notificationClient

import (
	"context"
	"log"
	"os"

	notifications "github.com/QuestraDigital/goServices/GitHub-Sync-Service/notificationClient/protos"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func getAddress() string {
	addr := os.Getenv("NOTIFICATION_SERVICE_ADDR")
	if addr == "" {
		addr = "localhost:50055"
	}
	return addr
}

func TriggerNotificationService(customMessage string) {
	conn, err := grpc.Dial(getAddress(), grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Printf("ERROR: did not connect to notification service: %v", err)
		return
	}
	defer conn.Close()

	client := notifications.NewNotificationsClient(conn)

	response, err := client.SendNotification(context.Background(), &notifications.NotificationRequest{
		Message: customMessage,
	})
	if err != nil {
		log.Printf("ERROR: sending notification failed: %v", err)
		return
	}

	log.Printf("Notification status: %s", response.Status)
}
