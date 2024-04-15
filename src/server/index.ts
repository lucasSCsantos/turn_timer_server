import http from 'http';
import { Server } from 'socket.io';
import { type JoinRoomEventData } from '../@types/socket';
import {
  createNewRoomAndJoin,
  exitRoom,
  findUser,
  getRoom,
  joinExistingRoom,
  setRoom,
  updateRoomConfig,
} from '../helpers/room';
import { type RoomConfig } from '../@types/redis';
// import { decrypt, encrypt } from '../utils/crypto';

const httpServer = http.createServer();

const io = new Server(httpServer, {
  pingTimeout: 30000,
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
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('ping', (callback) => {
    callback();
  });

  socket.on(
    'create_room',
    async ({ room: roomId, username, password, access }: JoinRoomEventData) => {
      try {
        // if (access === 'private') {
        //   password = encrypt(password);
        // }

        const room = await createNewRoomAndJoin(socket, roomId, username, {
          access,
          password,
        });

        const user = findUser(room, socket.id);

        // Unicast to client
        io.to(socket.id).emit('joined', user);

        // Broadcast to room
        io.to(roomId).emit('changed_room_config', room);
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    }
  );

  socket.on(
    'join_room',
    async ({ room: roomId, username, password }: JoinRoomEventData) => {
      try {
        const room = await getRoom(roomId);

        // if (
        //   room?.access === 'private' &&
        //   password &&
        //   decrypt(room.password) !== password
        // ) {
        //   socket.emit
        // }

        await joinExistingRoom(socket, room, username);

        const user = findUser(room, socket.id);

        // Unicast to client
        io.to(socket.id).emit('joined', user);

        // Broadcast to room
        io.to(roomId).emit('changed_room_config', room);
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    }
  );

  socket.on('start', async (config: RoomConfig) => {
    const users = config.users;

    if (config.live) {
      io.to(config.id).emit('start', { ...config, live: true, users });
      return;
    }

    users[0].playing = true;
    users[0].next = false;

    if (users.length > 1) {
      users[1].next = true;
    }

    io.to(config.id).emit('start', { ...config, live: true, users });

    try {
      const room = await getRoom(config.id);

      if (room) {
        const newRoomConfig = updateRoomConfig(room, config);
        await setRoom(config.id, newRoomConfig);
      }
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('change_turn', async (config: RoomConfig) => {
    const users = config.users;

    if (!config.live) {
      throw Error('This game has not started yet!');
    }

    const index = users.findIndex(({ playing }) => playing);
    const playingIndex = index + 1 === users.length ? 0 : index + 1;
    const nextIndex = index + 2 >= users.length ? 0 : index + 2;

    users[index].playing = false;
    users[playingIndex].next = false;
    users[playingIndex].playing = true;
    users[nextIndex].next = true;

    io.to(config.id).emit('change_turn', { ...config, live: true, users });

    try {
      const room = await getRoom(config.id);

      if (room) {
        const newRoomConfig = updateRoomConfig(room, config);
        await setRoom(config.id, newRoomConfig);
      }
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('stop', async (config: RoomConfig) => {
    if (!config.live) {
      throw Error('This game has not started yet');
    }

    io.to(config.id).emit('stop');
  });

  // socket.on('join_room', async ({ roomId, username }: JoinRoomEventData) => {
  //   try {
  //     const room = await getRoom(roomId);

  //     if (!room) {
  //       await createNewRoomAndJoin(socket, roomId, username);
  //     } else {
  //       await joinExistingRoom(socket, room, username);
  //     }

  //     const actualRoom = room ?? (await getRoom(roomId));
  //     const user = actualRoom ? findUser(actualRoom, socket.id) : null;

  //     io.to(socket.id).emit('joined', user);
  //     io.to(roomId).emit('user_joined', actualRoom);
  //   } catch (error: any) {
  //     socket.emit('error', { message: error.message });
  //   }
  // });

  // socket.on('exit_room', async ({ roomId }: JoinRoomEventData) => {
  //   try {
  //     void socket.leave(roomId);
  //     io.to(socket.id).emit('exited');

  //     const room = await getRoom(roomId);

  //     if (room) {
  //       await exitRoom(room, socket);

  //       if (room.users[0].id !== socket.id) {
  //         io.to(room.users[0].id).emit('change_role', room.users[0]);
  //       }

  //       io.to(roomId).emit('user_exited', room);
  //     }
  //   } catch (error: any) {
  //     socket.emit('error', { message: error.message });
  //   }
  // });

  // socket.on('invite', ({ inviteId, username }: InviteEventData) => {
  //   const roomId = decrypt(inviteId) ?? '';

  //   const room = await getRoom(roomId);

  //   if (room) {
  //     void socket.join(roomId);
  //     const index = rooms.indexOf(room);

  //     const user = room.users.find((u) => u.id === socket.id);

  //     if (!user) {
  //       room.users.push({
  //         username,
  //         id: socket.id,
  //         role: 'USER',
  //         number: room.users.length + 1,
  //       } as unknown as never);
  //     }

  //     rooms.splice(index, 1, room);

  //     const actualRoom = rooms.find((r) => r.id === roomId);
  //     const actualUser = actualRoom?.users.find((u) => u.id === socket.id);

  //     io.to(socket.id).emit('joined_by_invite', { user: actualUser, roomId });
  //     io.to(roomId).emit('user_joined', room);
  //   }
  // });

  // socket.on('change_room_config', async (config: RoomConfig) => {
  //   try {
  //     const room = await getRoom(config.id);

  //     if (room) {
  //       const newRoomConfig = updateRoomConfig(room, config);
  //       await setRoom(config.id, newRoomConfig);

  //       io.to(room.id).emit('changed_room_config', newRoomConfig);
  //     }
  //   } catch (error: any) {
  //     socket.emit('error', { message: error.message });
  //   }
  // });

  // socket.on('change_turn', async ({ roomId }: ChangeTurnEventData) => {
  //   try {
  //     const room = await getRoom(roomId);

  //     if (room) {
  //       const index = findUserIndex(room, socket.id);
  //       const users = room.users;

  //       if (index + 1 === users.length) {
  //         io.to(users[0].id).emit('start');
  //       } else {
  //         io.to(users[index + 1].id).emit('start');
  //       }
  //     }
  //   } catch (error: any) {
  //     socket.emit('error', { message: error.message });
  //   }
  // });

  socket.on('disconnecting', async () => {
    try {
      const roomId = [...socket.rooms][1];

      if (roomId) {
        void socket.leave(roomId);
        io.to(socket.id).emit('exited');

        const room = await getRoom(roomId);

        if (room) {
          await exitRoom(room, socket);

          if (room.users.length && room.users[0].id !== socket.id) {
            io.to(room.users[0].id).emit('change_role', room.users[0]);
          }

          io.to(roomId).emit('user_exited', room);
        }
      }
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

const PORT = process.env.PORT ?? 3001;

httpServer.listen(PORT, () => {
  console.log(`Socket.io server is running on port ${PORT}`);
});

export default httpServer;
