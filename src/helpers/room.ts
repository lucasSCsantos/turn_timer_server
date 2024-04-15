import { type Socket } from 'socket.io';
import { encrypt } from '../utils/crypto';
import { invalidate, recover, save } from '../utils/redis';
import { type User, type RoomConfig } from '../@types/redis';

const defaultRoomConfig: RoomConfig = {
  id: '',
  users: [],
  type: 'desc',
  time: 60000,
  access: 'public',
  url: '',
  live: false,
  password: '',
};

export const findUser = (
  room?: RoomConfig | null,
  id?: string
): User | undefined => {
  return room?.users.find((u) => u.id === id);
};

export const findUserByUsername = (
  room: RoomConfig,
  username: string
): User | undefined => {
  return room?.users.find((u) => u.username === username);
};

export const findUserIndex = (room: RoomConfig, id: string): number => {
  return room.users.findIndex((u) => u.id === id);
};

export const removeUser = (room: RoomConfig, id: string): User[] => {
  const index = room.users.findIndex((u) => u.id === id);

  if (index >= 0) {
    return [...room.users.slice(0, index), ...room.users.slice(index + 1)];
  }
  return room.users;
};

export const createRoomConfig = (
  roomId: string,
  user: { username: string; id: string },
  object: Partial<RoomConfig>
): RoomConfig => {
  const roomConfig: Partial<RoomConfig> = {
    ...object,
    id: roomId,
    users: [
      {
        ...user,
        role: 'ADMIN',
        next: true,
        playing: false,
      },
    ],
    url: createInviteUrl(roomId),
  };

  return roomConfig as RoomConfig;
};

export const updateRoomConfig = (
  object: Record<string, any>,
  config: Record<string, any>
): any => {
  return {
    ...object,
    ...config,
  };
};

export const createInviteUrl = (roomId: string): string => {
  const encryptedRoomId = encrypt(roomId);

  return `http://localhost:3000/invite/${encryptedRoomId}`;
};

export const getRoom = async (roomId: string): Promise<RoomConfig | null> => {
  const data = await recover(roomId);
  return data as RoomConfig;
};

export const setRoom = async (roomId: string, value: any): Promise<void> => {
  await save(roomId, value);
};

export const deleteRoom = async (roomId: string): Promise<void> => {
  await invalidate(roomId);
};

export const createNewRoomAndJoin = async (
  socket: Socket,
  roomId: string,
  username: string,
  config: { access: RoomConfig['access']; password: RoomConfig['password'] }
): Promise<RoomConfig> => {
  const room = await getRoom(roomId);

  if (room) {
    throw Error('There is already a room with this name!');
  }

  const roomConfig = createRoomConfig(
    roomId,
    { username, id: socket.id },
    { ...defaultRoomConfig, ...config }
  );

  await setRoom(roomId, roomConfig);
  void socket.join(roomId);

  return roomConfig;
};

export const joinExistingRoom = async (
  socket: Socket,
  room: RoomConfig | null,
  username: string
): Promise<void> => {
  if (!room) {
    throw Error('This room does not exist!');
  }

  if (room.live) {
    throw Error('You cant enter this room because it is already live!');
  }

  const userExists = findUserByUsername(room, username);

  if (userExists) {
    throw Error(
      'There is already an user with this username! Change it to enter this room.'
    );
  }

  const user = findUser(room, socket.id);

  if (!user) {
    room.users.push({
      username,
      id: socket.id,
      role: 'USER',
      next: false,
      playing: false,
    } as unknown as never);
  }

  await setRoom(room.id, room);
  void socket.join(room.id);
};

export const exitRoom = async (
  room: RoomConfig,
  socket: Socket
): Promise<void> => {
  const user = findUser(room, socket.id);

  if (user) {
    room.users = removeUser(room, socket.id);
  }

  if (!room.users.length) {
    void deleteRoom(room.id);
    return;
  }

  if (user?.role === 'ADMIN') {
    room.users[0].role = 'ADMIN';
  }

  await setRoom(room.id, room);
};
