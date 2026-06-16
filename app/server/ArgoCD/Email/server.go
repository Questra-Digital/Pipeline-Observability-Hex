package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	mongoconnection "github.com/QuestraDigital/goServices/Email/mongoConnection"
	"github.com/joho/godotenv"
	"github.com/nats-io/nats.go"
	"go.mongodb.org/mongo-driver/bson"
	"gopkg.in/gomail.v2"
)

func getNATSURL() string {
	url := os.Getenv("NATS_URL")
	if url == "" {
		url = nats.DefaultURL
	}
	return url
}

func isNotificationEnabled() (bool, error) {
	client := mongoconnection.GetClient()
	if client == nil {
		return false, nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	collection := client.Database("notification").Collection("email")
	var notificationData map[string]string
	err := collection.FindOne(ctx, bson.D{}).Decode(&notificationData)
	if err != nil {
		return false, err
	}
	return notificationData["status"] == "on", nil
}

func fetchRecipientEmail() (string, error) {
	client := mongoconnection.GetClient()
	if client == nil {
		return "", nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	collection := client.Database("admin").Collection("emails")
	var mailData map[string]string
	err := collection.FindOne(ctx, bson.D{}).Decode(&mailData)
	if err != nil {
		return "", err
	}
	return mailData["email"], nil
}

func sendEmailToUser(messageText string) error {
	if enabled, err := isNotificationEnabled(); err != nil {
		log.Println("Error checking notification status:", err)
		return err
	} else if !enabled {
		log.Println("Notification is disabled")
		return nil
	}

	client := mongoconnection.GetClient()
	if client == nil {
		return nil
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := client.Database("notification").Collection("email_notifier")
	var emailData map[string]string
	err := collection.FindOne(ctx, bson.D{}).Decode(&emailData)
	if err != nil {
		return err
	}

	senderEmail := emailData["email"]
	senderPassword := emailData["password"]

	smtpServer := os.Getenv("SMTP_SERVER")
	smtpPortStr := os.Getenv("SMTP_PORT")
	smtpPort, err := strconv.Atoi(smtpPortStr)
	if err != nil {
		log.Println("Error converting SMTP_PORT to int:", err)
		return err
	}

	recipientEmail, err := fetchRecipientEmail()
	if err != nil {
		log.Println("Error fetching recipient email:", err)
		return err
	}

	subject := "Pipeline-Status"

	mail := gomail.NewMessage()
	mail.SetHeader("From", senderEmail)
	mail.SetHeader("To", recipientEmail)
	mail.SetHeader("Subject", subject)
	mail.SetBody("text/plain", messageText)

	d := gomail.NewDialer(smtpServer, smtpPort, senderEmail, senderPassword)

	if err := d.DialAndSend(mail); err != nil {
		log.Println("Error sending email:", err)
		return err
	}

	log.Printf("Email sent to user: %s", recipientEmail)
	return nil
}

func main() {
	_ = godotenv.Load(".env")

	mongoconnection.Init()

	nc, err := nats.Connect(getNATSURL(), nats.RetryOnFailedConnect(true), nats.MaxReconnects(-1))
	if err != nil {
		log.Fatal(err)
	}
	defer nc.Close()

	nc.Subscribe("email", func(msg *nats.Msg) {
		err := sendEmailToUser(string(msg.Data))
		if err != nil {
			log.Println("Error sending message to Email:", err)
		}
	})

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down Email service...")
	nc.Drain()
	mongoconnection.Close()
}
