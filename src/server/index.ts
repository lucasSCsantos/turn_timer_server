import http from 'http';
import { Server } from 'socket.io';
import {
  type StartEventData,
  type ChangeOrderEventData,
  type ExitRoomData,
  type JoinRoomEventData,
  type RemovePlayerEventData,
  type StopEventData,
  type EndGameEventData,
} from '../@types/socket';
import {
  createNewRoomAndJoin,
  exitRoom,
  findUser,
  getRoom,
  joinExistingRoom,
  updateRoomConfig,
  validateRoom,
} from '../helpers/room';
import { generateUniqueCode } from '../utils/crypto';
import {
  getActualAndNextUser,
  getUser,
  updateActualUser,
  updateUserState,
} from '../helpers/users';

const httpServer = http.createServer();

const io = new Server(httpServer, {
  pingTimeout: 30000,
  cors: {
    origin: [
      'http://localhost:8081',
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
    async ({ room: name, username }: JoinRoomEventData) => {
      try {
        const roomId = generateUniqueCode(name);

        const room = await createNewRoomAndJoin(socket, roomId, username);

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
    async ({ room: roomId, username }: JoinRoomEventData) => {
      try {
        const room = await getRoom(roomId);

        if (room?.users.length) {
          throw Error('This room is full');
        }

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

  socket.on('change_order', async ({ roomId, users }: ChangeOrderEventData) => {
    try {
      const room = await validateRoom(roomId);

      if (room.live) {
        throw Error('This room is already live');
      }

      const user = getUser(socket.id, room);

      if (!user) {
        throw Error("This user doesn't exist or is not in this room");
      }

      if (user.role !== 'ADMIN') {
        throw Error('This user is not able to to this action');
      }

      const updatedRoom = await updateRoomConfig(room, { users });

      io.to(roomId).emit('changed_room_config', updatedRoom);
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('start', async ({ roomId, time }: StartEventData) => {
    try {
      const room = await validateRoom(roomId);

      const user = getUser(socket.id, room);

      if (!user) {
        throw Error("This user doesn't exist or is not in this room");
      }

      if (!room.live && user.position !== 1) {
        throw Error('This user is not able to to this action');
      }

      const updatedUsers = updateActualUser(user.id, room.users);

      const updatedRoom = await updateRoomConfig(room, {
        live: true,
        users: updatedUsers,
        round: !room.live ? 1 : room.round,
      });

      io.to(room.id).emit('changed_room_config', updatedRoom);

      io.to(room.id).emit('start', {
        date: new Date(),
        userId: socket.id,
        time: time || room.time,
      });
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('restart', async ({ roomId }: StartEventData) => {
    try {
      const room = await validateRoom(roomId);

      const user = getUser(socket.id, room);

      if (!user) {
        throw Error("This user doesn't exist or is not in this room");
      }

      if (!room.live) {
        throw Error('This room has not started already');
      }

      io.to(room.id).emit('start', {
        date: new Date(),
        userId: socket.id,
        time: room.time,
      });
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('end_game', async ({ roomId }: EndGameEventData) => {
    try {
      const room = await validateRoom(roomId);

      const user = getUser(socket.id, room);

      if (!user) {
        throw Error("This user doesn't exist or is not in this room");
      }

      if (!room.live && user.position !== 1) {
        throw Error('This user is not able to to this action');
      }

      const updatedUsers = updateActualUser(user.id, room.users);

      const updatedRoom = await updateRoomConfig(room, {
        live: false,
        users: updatedUsers,
      });

      io.to(room.id).emit('changed_room_config', updatedRoom);

      io.to(room.id).emit('end_game');
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('change_turn', async ({ roomId }: StartEventData) => {
    try {
      const room = await validateRoom(roomId);

      const user = getUser(socket.id, room);

      if (!user) {
        throw Error("This user doesn't exist or is not in this room");
      }

      if (!user.actual) {
        throw Error("It's not this user turn");
      }

      if (!room.live) {
        throw Error(
          "You can't change turn because this room is not live already"
        );
      }

      const { nextUser, actualUser } = getActualAndNextUser(
        user.id,
        room.users
      );

      const updatedUsers = updateUserState(nextUser, actualUser, room.users);

      const updatedRoom = await updateRoomConfig(room, {
        live: true,
        users: updatedUsers,
        round: nextUser.position === 1 ? room.round + 1 : room.round,
      });

      io.to(room.id).emit('changed_room_config', updatedRoom);

      io.to(room.id).emit('start', {
        date: new Date(),
        userId: nextUser.id,
        time: room.time,
      });
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('stop', async ({ roomId, time }: StopEventData) => {
    try {
      const room = await validateRoom(roomId);

      const user = getUser(socket.id, room);

      if (!user) {
        throw Error("This user doesn't exist or is not in this room");
      }

      if (user.role !== 'ADMIN') {
        throw Error('This user is not able to to this action');
      }

      if (!room.live) {
        throw Error('This room is not live');
      }

      io.to(room.id).emit('stop', { time });
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('exit', async ({ roomId }: ExitRoomData) => {
    try {
      const room = await validateRoom(roomId);

      const updatedRoom = await exitRoom(room, socket.id);

      void socket.leave(roomId);

      io.to(socket.id).emit('exit');

      if (updatedRoom) {
        if (updatedRoom.users[0].id !== socket.id) {
          io.to(updatedRoom.users[0].id).emit(
            'change_role',
            updatedRoom.users[0]
          );
        }

        io.to(roomId).emit('user_exited', updatedRoom);
      }
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on(
    'remove_player',
    async ({ roomId, userId }: RemovePlayerEventData) => {
      try {
        const room = await validateRoom(roomId);

        const user = getUser(socket.id, room);

        if (!user || user.role !== 'ADMIN') {
          throw Error('This user is not able to to this action');
        }

        if (userId === socket.id) {
          throw Error('You are not able to remove yourself!');
        }

        const updatedRoom = await exitRoom(room, userId);

        io.to(userId).emit('exit');

        if (updatedRoom) {
          io.to(roomId).emit('user_exited', updatedRoom);
        }
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    }
  );

  socket.on('disconnecting', async () => {
    try {
      const roomId = [...socket.rooms][1];

      if (roomId) {
        const room = await validateRoom(roomId);

        const updatedRoom = await exitRoom(room, socket.id);

        void socket.leave(roomId);

        io.to(socket.id).emit('exit');

        if (updatedRoom) {
          if (updatedRoom.users[0].id !== socket.id) {
            io.to(updatedRoom.users[0].id).emit(
              'change_role',
              updatedRoom.users[0]
            );
          }

          io.to(roomId).emit('user_exited', updatedRoom);
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
