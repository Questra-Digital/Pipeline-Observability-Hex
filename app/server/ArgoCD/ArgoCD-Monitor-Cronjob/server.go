package main

import (
	"context"
	"log"
	"net"

	"github.com/QuestraDigital/goServices/ArgoCD-Monitor-Cronjob/controller"
	grpc_cronjob_controller "github.com/QuestraDigital/goServices/ArgoCD-Monitor-Cronjob/grpc_server/protos"
	"github.com/robfig/cron"
	"google.golang.org/grpc"
)

// just for testing
const (
	// Port to listen on
	port = ":50059"
)

type server struct {
	grpc_cronjob_controller.UnimplementedCronjobControllerServer
	isCronJobRunning bool // This will be used to check if the cron job is running
}

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

// implement the ControlCronjob method
func (s *server) ControlCronjob(ctx context.Context, in *grpc_cronjob_controller.ControlCronjobRequest) (*grpc_cronjob_controller.ControlCronjobResponse, error) {
	status := in.GetStartCronjob()
	log.Printf("(Server)Received Staus: %v", status)
	if status {
		if !s.isCronJobRunning {
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
			log.Printf("Stopping Cronjob")
			// Stop the cron job
			cronjobStopper <- true
			// Set the status to false
			s.isCronJobRunning = false
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
	lis, err := net.Listen("tcp", port)
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}
	s := grpc.NewServer()
	grpc_cronjob_controller.RegisterCronjobControllerServer(s, &server{})
	runAllPipelinesStatusCronJob()
	if err := s.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}
