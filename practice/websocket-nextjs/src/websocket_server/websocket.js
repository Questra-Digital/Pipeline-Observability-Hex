const { getRandomValues } = require('crypto');
const {createServer} = require('http');
const { Server } = require('socket.io');

// Creating a server
const httpServer = createServer();

// creating a new instance of io and adding methods we are using along with adding hosts that can commuincate with it
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }   
});


// event when a new client activates the socket connection
io.on('connection', async (socket) => {
    console.log('connection succesful with client');
    // console.log(socket.id)

    // To get the event from client we have to decalre all of them inside this connection
    socket.on('myevent', (data) => {
        // Emitting a new response for Client in response to the client event
        console.log('recieved request from client');
        socket.emit('responseEvent', "Hello, Client"+Math.random())
        console.log('emitted to the client');
    })

})



// Assigning a port to server where it can listen the requests
httpServer.listen(5000, ()=> {
    console.log("Listening at port 5000");
})