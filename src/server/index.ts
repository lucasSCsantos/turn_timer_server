// import http from 'http';
// import { Server } from 'socket.io';
import express, { type Request, type Response } from 'express';

// const httpServer = http.createServer();
const app = express();

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

// const io = new Server(httpServer, {
//   cors: {
//     origin: ['https://rumikub-counter.vercel.app'], // Replace with your frontend URL
//     methods: ['GET', 'POST'],
//     allowedHeaders: ['my-custom-header'],
//     credentials: true,
//   },
// });

// io.on('connection', (socket) => {
//   console.log('A user connected:', socket.id);

//   socket.on('join_room', (roomId: string) => {
//     void socket.join(roomId);
//     const clients = io.sockets.adapter.rooms.get(roomId);

//     console.log(clients?.size);

//     if (clients?.size === 1) {
//       socket.emit('start');
//     }

//     console.log(`user with id-${socket.id} joined room - ${roomId}`);
//     socket.emit('number', clients?.size);
//   });

//   socket.on(
//     'press_btn',
//     (data: { roomId: string; number: number; start: boolean }) => {
//       // This will send a message to a specific room ID
//       const clients = io.sockets.adapter.rooms.get(data.roomId);
//       const actualNumber = data.number;

//       if (clients) {
//         const clientsList = Array.from(clients);

//         const nextNumber = clients.size === actualNumber ? 1 : actualNumber + 1;
//         const nextClient = clientsList[nextNumber - 1];

//         console.log(data.start);

//         if (data.start) {
//           socket.emit('turn');
//         } else {
//           io.to(nextClient).emit('turn');
//         }
//       }

//       // socket.to(data.roomId).emit("receive_press", data);
//     }
//   );

//   socket.on('disconnect', () => {
//     console.log('A user disconnected:', socket.id);
//   });
// });

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`Socket.io server is running on port ${PORT}`);
});

export default app;
