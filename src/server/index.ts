import http from 'http';
import { Server } from 'socket.io';
import { validateUsername } from '../helpers/users';
import errors from '../data/errors';
import {
  type ChangeTurnEventData,
  type JoinRoomEventData,
} from '../@types/socket';

const httpServer = http.createServer();

const io = new Server(httpServer, {
  cors: {
    origin: [
      'https://rumikub-counter.vercel.app',
      'http://localhost:3000',
      'https://rumikub-counter-git-develop-lucasscsantos.vercel.app',
    ],
    methods: ['GET', 'POST'],
    // allowedHeaders: ['my-custom-header'],
    credentials: true,
  },
});

const users: Record<
  string,
  Record<
    string,
    {
      username: string;
      role: string;
      number: number;
    }
  >
> = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  let currentRoomId: string;

  socket.on('join_room', ({ roomId, username }: JoinRoomEventData) => {
    void socket.join(roomId);

    currentRoomId = roomId;

    users[roomId] = {
      ...users[roomId],
    };

    const usernameAlreadyExists = validateUsername(users, username, roomId);

    if (usernameAlreadyExists) {
      socket.emit('user_join_error', {
        error: errors.username_already_exists,
      });

      return;
    }

    const clients = io.sockets.adapter.rooms.get(roomId);

    if (clients) {
      users[roomId][socket.id] = {
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

  socket.on('change_turn', ({ roomId, number }: ChangeTurnEventData) => {
    const clients = io.sockets.adapter.rooms.get(roomId);
    const actualNumber = number;

    if (clients) {
      const clientsList = Array.from(clients);

      const nextNumber = clients.size === actualNumber ? 1 : actualNumber + 1;
      const nextClient = clientsList[nextNumber - 1];

      io.to(nextClient).emit('turn');
    }
  });

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
          username: users[roomId][socket.id].username,
          action: 'disconnect',
        });

        if (admin !== socket.id && users[roomId][socket.id].role === 'ADMIN') {
          io.to(admin).emit('user_log', {
            id: admin,
            username: users[roomId][admin].username,
            action: 'admin_change',
          });
        }

        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete users[roomId][socket.id];
      }

      if (!clients) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete users[roomId];
      }
    }

    console.log('A user disconnected:', socket.id);
  });
});

const PORT = process.env.PORT ?? 3000;

httpServer.listen(PORT, () => {
  console.log(`Socket.io server is running on port ${PORT}`);
});

export default httpServer;
