import http from 'http';
import { Server } from 'socket.io';
import { findAdmin, findFirst, getRoomUsersList } from '../helpers/users';
import {
  type RestartTimerEventData,
  type ChangeTurnEventData,
  type JoinRoomEventData,
  type ChangeOrderEventData,
} from '../@types/socket';
import { setRoomConfig, updateRoomConfig } from '../helpers/room';

const httpServer = http.createServer();

const io = new Server(httpServer, {
  cors: {
    origin: [
      // 'https://rumikub-counter.vercel.app',
      // 'http://localhost:3000',
      // 'http://localhost:8081',
      'exp://192.168.1.11:8081',
      'http://192.168.1.11:8081',
      '*',
    ],
    methods: ['GET', 'POST'],
    // allowedHeaders: ['my-custom-header'],
    credentials: true,
  },
});

const started: string[] = [];
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
const defaultConfigs = {
  id: '',
  users: [],
  type: 'desc',
  time: 60000,
  access: 'public',
  url: '',
};
const rooms: Array<typeof defaultConfigs> = [];

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  let currentRoomId: string;

  socket.on('join_room', ({ roomId, username }: JoinRoomEventData) => {
    console.log('aaaaaaaaaaaaaaaaaaaaaaaa');
    void socket.join(roomId);

    const room = rooms.find((r) => r.id === roomId);

    if (!room) {
      const roomConfig = setRoomConfig(
        roomId,
        { username, id: socket.id },
        defaultConfigs
      );

      rooms.push(roomConfig as typeof defaultConfigs);
    } else {
      const index = rooms.indexOf(room);

      room.users.push({
        username,
        id: socket.id,
        role: 'USER',
        number: room.users.length + 1,
      } as unknown as never);

      rooms.splice(index, 1, room);
    }

    // const usernameAlreadyExists = validateUsername(users, username, roomId);

    // if (usernameAlreadyExists) {
    //   socket.emit('user_join_error', {
    //     error: errors.username_already_exists,
    //   });

    //   return;
    // }

    // const clients = io.sockets.adapter.rooms.get(roomId);
    console.log(room, rooms);
    io.to(roomId).emit('joined', room);
    // if (clients) {
    // users[roomId][socket.id] = {
    //   username,
    //   role: clients?.size === 1 ? 'ADMIN' : 'USER',
    //   number: clients?.size,
    // };

    // const [admin] = Array.from(clients);

    // if (started.includes(roomId)) {
    //   socket.emit('start');
    // }

    // io.to(admin).emit('user_log', {
    //   id: socket.id,
    //   username,
    //   action: 'connect',
    // });
    // }
  });

  socket.on('change_room_config', (config: typeof defaultConfigs) => {
    const room = rooms.find((r) => r.id === config.id);

    if (room) {
      const index = rooms.indexOf(room);

      const newRoomConfig = updateRoomConfig(room, config);

      rooms.splice(index, 1, newRoomConfig as typeof defaultConfigs);

      io.to(room.id).emit('changed_room_config', newRoomConfig);

      console.log(rooms);
    }
  });

  socket.on('change_turn', ({ roomId, number }: ChangeTurnEventData) => {
    const clients = getRoomUsersList(users[roomId]);
    const actualNumber = number;

    if (clients) {
      const nextNumber = clients.length === actualNumber ? 1 : actualNumber + 1;
      const nextClient =
        clients.find(({ number }) => number === nextNumber)?.id ??
        clients[nextNumber - 1].id;

      io.to(nextClient).emit('turn');
    }
  });

  socket.on('start', (roomId: string) => {
    started.push(roomId);
    socket.to(roomId).emit('start');
  });

  socket.on('stop', (roomId: string) => {
    started.splice(started.indexOf(roomId), 1);
    socket.to(roomId).emit('stop');
  });

  socket.on('restart_timer', ({ roomId, userId }: RestartTimerEventData) => {
    const clients = getRoomUsersList(users[roomId]);
    const admin = findAdmin(clients);

    if (userId !== admin?.id) {
      throw new Error('User is not admin');
    }

    if (clients) {
      const firstClient = findFirst(clients);

      if (firstClient) io.to(firstClient?.id).emit('turn');
    }
  });

  socket.on(
    'change_order',
    ({ roomId, admin, newOrder }: ChangeOrderEventData) => {
      if (!admin) {
        throw new Error('User is not admin');
      }

      console.log(
        'on change order',
        newOrder.map(({ number }) => number)
      );
      console.log(newOrder);
      newOrder.forEach(({ id, number }) => {
        users[roomId][id].number = number;
      });

      io.to(roomId).emit('users_list', newOrder);
    }
  );

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

        getRoomUsersList(users[roomId])
          .sort((a, b) => a.number - b.number)
          .forEach(({ id, number }, index) => {
            users[roomId][id].number = index + 1;
          });

        io.to(roomId).emit('users_list', getRoomUsersList(users[roomId]));
      }

      if (!clients) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete users[roomId];
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
