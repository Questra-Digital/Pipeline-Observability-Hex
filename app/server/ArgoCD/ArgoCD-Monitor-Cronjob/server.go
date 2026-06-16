package main

import (
	"context"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"github.com/QuestraDigital/goServices/ArgoCD-Monitor-Cronjob/controller"
	grpc_cronjob_controller "github.com/QuestraDigital/goServices/ArgoCD-Monitor-Cronjob/grpc_server/protos"
	mongoconnection "github.com/QuestraDigital/goServices/ArgoCD-Monitor-Cronjob/mongoConnection"
	"github.com/joho/godotenv"
	"github.com/robfig/cron"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"google.golang.org/grpc"
)

func getPort() string {
	port := os.Getenv("CRONJOB_PORT")
	if port == "" {
		port = ":50059"
	}
	return port
}

func getCronSchedule() string {
	schedule := os.Getenv("CRONJOB_SCHEDULE")
	if schedule == "" {
		schedule = "*/5 * * * * *"
	}
	return schedule
}

var mongoClient *mongo.Client

func initMongoDBClient() {
	client, err := mongoconnection.ConnectToMongoDB()
	if err != nil {
		log.Fatalf("Error connecting to MongoDB: %v", err)
	}
	mongoClient = client
}

type server struct {
	grpc_cronjob_controller.UnimplementedCronjobControllerServer
	isCronJobRunning bool
}

var cronjobStopper = make(chan bool, 1)

func runAllPipelinesStatusCronJob() {
	c := cron.New()

	job := cron.FuncJob(controller.AllPipelinesStatus)

	err := c.AddJob(getCronSchedule(), job)
	if err != nil {
		log.Printf("Error adding cron job: %v", err)
		return
	}

	c.Start()

	<-cronjobStopper
	c.Stop()
}

func StoreCronjobStatus(isRunning bool) error {
	collection := mongoClient.Database("admin").Collection("cronjob")
	ctx := context.Background()
	_, err := collection.DeleteMany(ctx, bson.D{})
	if err != nil {
		return err
	}
	_, err = collection.InsertOne(ctx, bson.M{"status": isRunning})
	return err
}

func GetCronjobStatus() (bool, error) {
	collection := mongoClient.Database("admin").Collection("cronjob")
	ctx := context.Background()
	var result bson.M
	err := collection.FindOne(ctx, bson.D{}).Decode(&result)
	if err != nil {
		return false, err
	}
	status, ok := result["status"].(bool)
	if !ok {
		return false, nil
	}
	return status, nil
}

func (s *server) ControlCronjob(ctx context.Context, in *grpc_cronjob_controller.ControlCronjobRequest) (*grpc_cronjob_controller.ControlCronjobResponse, error) {
	status := in.GetStartCronjob()
	log.Printf("(Server)Received Status: %v", status)
	if status {
		if !s.isCronJobRunning {
			err := StoreCronjobStatus(true)
			if err != nil {
				log.Printf("Error storing cronjob status: %v", err)
				return &grpc_cronjob_controller.ControlCronjobResponse{Success: false, Message: "Error storing cronjob status"}, nil
			}
			go runAllPipelinesStatusCronJob()
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
			cronjobStopper <- true
			s.isCronJobRunning = false
			log.Printf("Stopping Cronjob")
			return &grpc_cronjob_controller.ControlCronjobResponse{Success: true, Message: "Cronjob Stopped"}, nil
		} else {
			log.Printf("Cronjob already Stopped")
			return &grpc_cronjob_controller.ControlCronjobResponse{Success: false, Message: "Cronjob already Stopped"}, nil
		}
	}
}

func (s *server) GetCronjobStatus(ctx context.Context, in *grpc_cronjob_controller.CronjobStatus) (*grpc_cronjob_controller.CronjobStatusResponse, error) {
	if s.isCronJobRunning {
		return &grpc_cronjob_controller.CronjobStatusResponse{Running: true}, nil
	}
	return &grpc_cronjob_controller.CronjobStatusResponse{Running: false}, nil
}

func main() {
	_ = godotenv.Load(".env")

	initMongoDBClient()

	lis, err := net.Listen("tcp", getPort())
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}
	grpc_server := grpc.NewServer()
	s := &server{}
	status, err := GetCronjobStatus()
	if err != nil {
		log.Printf("Error getting cronjob status: %v", err)
	}
	if status {
		s.isCronJobRunning = true
		go runAllPipelinesStatusCronJob()
	}

	grpc_cronjob_controller.RegisterCronjobControllerServer(grpc_server, s)

	go func() {
		if err := grpc_server.Serve(lis); err != nil {
			log.Fatalf("Failed to serve: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
	grpc_server.GracefulStop()
	mongoconnection.Close()
}
