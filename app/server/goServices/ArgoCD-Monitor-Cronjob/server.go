package main

import (
	"github.com/QuestraDigital/goServices/ArgoCD-Monitor-Cronjob/controller"
	"github.com/robfig/cron"
)

func runAllPipelinesStatusCronJob() {
	// Create a new cron scheduler
	c := cron.New()

	// Define your cron job
	job := cron.FuncJob(controller.AllPipelinesStatus)

	// Add the cron job to the scheduler
	c.AddJob("*/5 * * * * *", job) // This cron syntax means every 5 seconds

	// Start the scheduler
	c.Start()
	// just for pipeline testing
}

func main() {
	runAllPipelinesStatusCronJob()
	select {}
}
