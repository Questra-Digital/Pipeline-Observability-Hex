package main

import (
	"context"
	"log"
	"os"
	"strconv"
	"time"

	mongoconnection "github.com/QuestraDigital/goServices/Email/mongoConnection"
	"github.com/nats-io/nats.go"
	"go.mongodb.org/mongo-driver/bson"
	"gopkg.in/gomail.v2"

	_ "github.com/joho/godotenv/autoload"
)

// check if the notification status is enabled
func isNotificationEnabled() (bool, error) {
	// connect to MongoDB
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		return false, err
	}
	defer mongoClient.Disconnect(context.TODO())
	// fetch notification status from MongoDB
	collection := mongoClient.Database("notification").Collection("email")
	var notificationData map[string]string
	err = collection.FindOne(context.TODO(), bson.D{}).Decode(&notificationData)
	if err != nil {
		return false, err
	}
	notificationStatus := notificationData["status"]
	if notificationStatus == "on" {
		return true, nil
	}
	return false, nil
}

// Fetch the recipient email from MongoDB
func fetchRecipientEmail() (string, error) {
	// connect to MongoDB
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		return "", err
	}
	defer mongoClient.Disconnect(context.TODO())
	// fetch email from MongoDB

	collection := mongoClient.Database("admin").Collection("emails")
	var mailData map[string]string
	err = collection.FindOne(context.TODO(), bson.D{}).Decode(&mailData)
	if err != nil {
		return "", err
	}
	recipientEmail := mailData["email"]
	log.Println("Recipient email:", recipientEmail)
	return recipientEmail, nil
}

// send Email to User
func sendEmailToUser(messageText string) error {
	// check if notification is enabled
	if enabled, err := isNotificationEnabled(); err != nil {
		log.Println("Error checking notification status:", err)
		return err
	} else if !enabled {
		log.Println("Notification is disabled")
		return nil
	}

	// send email to user
	log.Printf("Email sent to user: %s", messageText)

	// fetch email credentials from MongoDB
	mongoClient, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		return err
	}
	defer mongoClient.Disconnect(context.TODO())

	// fetch email credentials from MongoDB
	collection := mongoClient.Database("notification").Collection("email_notifier")
	var emailData map[string]string
	err = collection.FindOne(context.TODO(), bson.D{}).Decode(&emailData)
	if err != nil {
		return err
	}

	// get email credentials
	senderEmail := emailData["email"]
	senderPassword := emailData["password"]
	// SMTP configuration
	smtpServer := os.Getenv("SMTP_SERVER")
	smtpPortStr := string(os.Getenv("SMTP_PORT"))
	smtpPort, err := strconv.Atoi(smtpPortStr)
	if err != nil {
		log.Println("Error converting SMTP_PORT to int:", err)
		return err
	}
	// get recipient email from mongoDB
	recipientEmail, err := fetchRecipientEmail()
	if err != nil {
		log.Println("Error fetching recipient email:", err)
		return err
	}

	subject := "Pipeline-Status"
	// Create a new message
	mail := gomail.NewMessage()
	mail.SetHeader("From", senderEmail)
	mail.SetHeader("To", recipientEmail)
	mail.SetHeader("Subject", subject)
	mail.SetBody("text/plain", messageText)

	// Create a new SMTP client
	d := gomail.NewDialer(smtpServer, smtpPort, senderEmail, senderPassword)

	// Send the email
	if err := d.DialAndSend(mail); err != nil {
		log.Println("Error sending email:", err)
		return err
	}

	log.Printf("Email sent to user: %s", recipientEmail)
	return nil
}

func main() {
	// Connect to NATS server
	nc, err := nats.Connect(nats.DefaultURL)
	if err != nil {
		log.Fatal(err)
	}
	defer nc.Close()

	// Register as an observer with the Notifications service
	log.Println("Registering as an observer with the Notifications service...")

	// Wait for Notifications service to be ready
	time.Sleep(2 * time.Second)

	// Send registration request
	msg, err := nc.Request("observer_email", []byte("register"), 5*time.Second)
	if err != nil {
		log.Printf("Failed to register with Notifications service: %v", err)
	} else {
		log.Printf("Registration response: %s", string(msg.Data))
	}

	// Subscribe to the email subject to receive notifications
	nc.Subscribe("email", func(msg *nats.Msg) {
		log.Printf("Received notification: %s", string(msg.Data))
		err := sendEmailToUser(string(msg.Data))
		if err != nil {
			log.Println("Error sending email:", err)
		}
	})

	log.Println("Email service is running...")

	// Keep the subscriber running
	select {}
}
