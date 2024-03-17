# Start from the latest golang base image
FROM golang:1.22.1

# Set the Current Working Directory inside the Docker container
WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download all dependencies. Dependencies will be cached if the go.mod and go.sum files are not changed
RUN go mod download

# go mod tidy to remove unused dependencies
RUN go mod tidy

# Copy the source from the current directory to the Working Directory inside the Docker container
COPY . .

# Command to run the executable
CMD ["go", "run", "server.go"]