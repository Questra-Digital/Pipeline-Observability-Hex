package main

import (
    "context"
    "log"
    "net"
	"github.com/slack-go/slack"
    "google.golang.org/grpc"
    pb "github.com/QuestraDigital/goServices/Slack/protos"
)

type slackServer struct {
    pb.UnimplementedSlackServiceServer
}

func sendMessageToSlack(botToken, channelID, messageText string) error {
	api := slack.New(botToken)

	message := slack.MsgOptionText(messageText, false)

	channel, timestamp, err := api.PostMessage(channelID, message)
	if err != nil {
		return err
	}

	log.Printf("Message sent to channel %s at %s", channel, timestamp)
	return nil
}

func (s *slackServer) SendMessage(ctx context.Context, req *pb.SlackMessageRequest) (*pb.SlackMessageResponse, error) {
    err := sendMessageToSlack(req.BotToken, req.ChannelId, req.MessageText)
    if err != nil {
        return &pb.SlackMessageResponse{Success: false, ErrorMessage: err.Error()}, nil
    }
    return &pb.SlackMessageResponse{Success: true}, nil
}

func (s *slackServer) mustEmbedUnimplementedSlackServiceServer() {}


func main() {
    lis, err := net.Listen("tcp", ":50051")
    if err != nil {
        log.Fatalf("Failed to listen: %v", err)
    }

    grpcServer := grpc.NewServer()
    pb.RegisterSlackServiceServer(grpcServer, &slackServer{})

    log.Println("gRPC server started on :50051")
    if err := grpcServer.Serve(lis); err != nil {
        log.Fatalf("Failed to serve: %v", err)
    }
}
