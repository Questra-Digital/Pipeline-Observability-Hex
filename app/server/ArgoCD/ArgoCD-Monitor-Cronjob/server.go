package main

import (
	"context"
	"log"
	"net"

	"github.com/QuestraDigital/goServices/ArgoCD-Monitor-Cronjob/controller"
	grpc_cronjob_controller "github.com/QuestraDigital/goServices/ArgoCD-Monitor-Cronjob/grpc_server/protos"
	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Monitor-Cronjob/mongoConnection"
	"github.com/robfig/cron"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"google.golang.org/grpc"
)

// just for testing
const (
	// Port to listen on
	port = ":50059"
)

var mongoClient *mongo.Client

func initMongoDBClient() {
	// Initialize MongoDB client
	client, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		log.Fatalf("Error connecting to MongoDB: %v", err)
	}
	mongoClient = client
	// defer mongoClient.Disconnect(context.TODO())
}

type server struct {
	grpc_cronjob_controller.UnimplementedCronjobControllerServer
	isCronJobRunning bool // This will be used to check if the cron job is running
}

// test
var cronjobStopper = make(chan bool) // This channel will be used to stop the cron job

func runAllPipelinesStatusCronJob() {
	// Create a new cron scheduler
	c := cron.New()

	// Define your cron job
	job := cron.FuncJob(controller.AllPipelinesStatus)

	// Add the cron job to the scheduler
	c.AddJob("*/5 * * * * *", job) // This cron syntax means every 5 seconds

	// Start the scheduler
	c.Start()

	// Stop the cron job
	<-cronjobStopper
	c.Stop()
}

func StoreCronjobStatus(isRunning bool) error {
	// connect to MongoDB
	collection := mongoClient.Database("admin").Collection("cronjob")
	// delete the existing status
	_, err := collection.DeleteMany(context.TODO(), bson.D{})
	if err != nil {
		return err
	}
	_, err = collection.InsertOne(context.TODO(), bson.M{"status": isRunning})
	if err != nil {
		return err
	}
	return nil
}

func GetCronjobStatus() (bool, error) {
	// connect to MongoDB
	collection := mongoClient.Database("admin").Collection("cronjob")
	var result bson.M
	err := collection.FindOne(context.TODO(), bson.D{}).Decode(&result)
	if err != nil {
		return false, err
	}
	status, ok := result["status"].(bool)
	if !ok {
		return false, nil
	}
	return status, nil
}

// implement the ControlCronjob method
func (s *server) ControlCronjob(ctx context.Context, in *grpc_cronjob_controller.ControlCronjobRequest) (*grpc_cronjob_controller.ControlCronjobResponse, error) {
	status := in.GetStartCronjob()
	log.Printf("(Server)Received Staus: %v", status)
	if status {
		if !s.isCronJobRunning {
			// Store the status in MongoDB
			err := StoreCronjobStatus(true)
			if err != nil {
				log.Printf("Error storing cronjob status: %v", err)
				return &grpc_cronjob_controller.ControlCronjobResponse{Success: false, Message: "Error storing cronjob status"}, nil
			}
			// Start the cron job
			go runAllPipelinesStatusCronJob()
			// Set the status to true
			s.isCronJobRunning = true
			log.Printf("Starting Cronjob")
			return &grpc_cronjob_controller.ControlCronjobResponse{Success: true, Message: "Cronjob started"}, nil
		} else {
			log.Printf("Cronjob already running")
			return &grpc_cronjob_controller.ControlCronjobResponse{Success: false, Message: "Cronjob already running"}, nil
		}
	} else {
		if s.isCronJobRunning {
			err := StoreCronjobStatus(false)
			if err != nil {
				log.Printf("Error storing cronjob status: %v", err)
				return &grpc_cronjob_controller.ControlCronjobResponse{Success: false, Message: "Error storing cronjob status"}, nil
			}
			// Stop the cron job
			cronjobStopper <- true
			// Set the status to false
			s.isCronJobRunning = false
			log.Printf("Stopping Cronjob")
			return &grpc_cronjob_controller.ControlCronjobResponse{Success: true, Message: "Cronjob Stopped"}, nil
		} else {
			log.Printf("Cronjob already Stopped")
			return &grpc_cronjob_controller.ControlCronjobResponse{Success: false, Message: "Cronjob already Stopped"}, nil
		}
	}
}

// implement the GetCronjobStatus method
func (s *server) GetCronjobStatus(ctx context.Context, in *grpc_cronjob_controller.CronjobStatus) (*grpc_cronjob_controller.CronjobStatusResponse, error) {
	if s.isCronJobRunning {

		return &grpc_cronjob_controller.CronjobStatusResponse{Running: true}, nil
	}
	return &grpc_cronjob_controller.CronjobStatusResponse{Running: false}, nil
}

func main() {
	// Start gRPC server
	initMongoDBClient()
	lis, err := net.Listen("tcp", port)
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}
	grpc_server := grpc.NewServer()
	s := &server{}
	status, err := GetCronjobStatus()
	if err != nil {
		log.Printf("Error getting cronjob status: %v\n", err)
	}
	if status {
		// Set the status to true
		s.isCronJobRunning = true
		// Start the cron job
		go runAllPipelinesStatusCronJob()
	}

	grpc_cronjob_controller.RegisterCronjobControllerServer(grpc_server, s)

	if err := grpc_server.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}
