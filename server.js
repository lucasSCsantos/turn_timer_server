const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const httpServer = http.createServer();

const io = new Server(httpServer, {
  cors: {
    origin: ["https://rumikub-counter.vercel.app", "http://localhost:3000"], // Replace with your frontend URL
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});


io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    const clients = io.sockets.adapter.rooms.get(roomId);

    console.log(clients.size)

    if (clients.size === 1) {
     socket.emit("start")
    }

    console.log(`user with id-${socket.id} joined room - ${roomId}`);
    socket.emit("number", clients.size)
  });

  socket.on("press_btn", (data) => {
    //This will send a message to a specific room ID
    const clients = io.sockets.adapter.rooms.get(data.roomId);
    const actualNumber = data.number;
    
    const [...clientsList] = clients;

    const nextNumber = clients.size === actualNumber ? 1 : actualNumber + 1;
    const nextClient = clientsList[nextNumber - 1];

    console.log(data.start)

    if (data.start) {
      socket.emit("turn");
    } else {
      io.to(nextClient).emit("turn")
    }


    // socket.to(data.roomId).emit("receive_press", data);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Socket.io server is running on port ${PORT}`);
});