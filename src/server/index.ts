import http from 'http';
import { Server } from 'socket.io';

const httpServer = http.createServer();

const io = new Server(httpServer, {
  cors: {
    origin: ['https://rumikub-counter.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    // allowedHeaders: ['my-custom-header'],
    credentials: true,
  },
});

interface JoinRoomEventData {
  roomId: string;
  username: string;
}

// interface UserDisconnectedEventData extends JoinRoomEventData {}

const users: Record<
  string,
  { username: string; role: string; number: number }
> = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  let currentRoomId: string;

  socket.on('join_room', ({ roomId, username }: JoinRoomEventData) => {
    void socket.join(roomId);
    currentRoomId = roomId;

    const clients = io.sockets.adapter.rooms.get(roomId);

    if (clients) {
      users[socket.id] = {
        username,
        role: clients?.size === 1 ? 'ADMIN' : 'USER',
        number: clients?.size,
      };

      socket.emit('user_join', {
        username,
        invite_id: 1,
        role: clients?.size === 1 ? 'ADMIN' : 'USER',
        number: clients?.size,
      });

      const [admin] = Array.from(clients);

      io.to(admin).emit('user_log', {
        id: socket.id,
        username,
        action: 'connect',
      });
    }
  });

  // socket.on(
  //   'user_disconnect',
  //   ({ roomId, username }: UserDisconnectedEventData) => {
  //     const clients = io.sockets.adapter.rooms.get(roomId);
  //     console.log('aaaaaaaaa');
  //     if (clients) {
  //       socket.emit('users_change', {
  //         role: clients?.size === 1 ? 'ADMIN' : 'USER',
  //         number: clients?.size,
  //       });

  //       const [admin] = Array.from(clients);

  //       io.to(admin).emit('user_log', {
  //         id: socket.id,
  //         username,
  //         action: 'disconnect',
  //       });
  //     }
  //   }
  // );

  // socket.on(
  //   'press_btn',
  //   (data: { roomId: string; number: number; start: boolean }) => {
  //     // This will send a message to a specific room ID
  //     const clients = io.sockets.adapter.rooms.get(data.roomId);
  //     const actualNumber = data.number;

  //     if (clients) {
  //       const clientsList = Array.from(clients);

  //       const nextNumber = clients.size === actualNumber ? 1 : actualNumber + 1;
  //       const nextClient = clientsList[nextNumber - 1];

  //       console.log(data.start);

  //       if (data.start) {
  //         socket.emit('turn');
  //       } else {
  //         io.to(nextClient).emit('turn');
  //       }
  //     }

  //     // socket.to(data.roomId).emit("receive_press", data);
  //   }
  // );

  socket.on('disconnect', () => {
    const roomId = currentRoomId;

    if (roomId) {
      const clients = io.sockets.adapter.rooms.get(roomId);

      if (clients) {
        Array.from(clients).forEach((client, index) => {
          socket.to(client).emit('users_change', {
            role: index === 0 ? 'ADMIN' : 'USER',
            number: index + 1,
          });
        });

        const [admin] = Array.from(clients);

        io.to(admin).emit('user_log', {
          id: socket.id,
          username: users[socket.id].username,
          action: 'disconnect',
        });

        console.log('user disconnecting', socket.id, 'new admin', admin);

        if (admin !== socket.id && users[socket.id].role === 'ADMIN') {
          io.to(admin).emit('user_log', {
            id: admin,
            username: users[admin].username,
            action: 'admin_change',
          });
        }
      }
    }

    console.log('A user disconnected:', socket.id);
  });
});

const PORT = process.env.PORT ?? 3001;

httpServer.listen(PORT, () => {
  console.log(`Socket.io server is running on port ${PORT}`);
});

export default httpServer;
