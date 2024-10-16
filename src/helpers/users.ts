import { type RoomConfig, type User } from '../@types/redis';

export interface UserDataWithId extends User {
  id: string;
}

export const validateUsername = (
  users: Record<string, Record<string, User>>,
  username: string,
  roomId: string
): boolean => {
  const usernames = Object.values(users[roomId]).map(
    ({ username }) => username
  );

  if (usernames.includes(username)) {
    return true;
  }

  return false;
};

export const getRoomUsersList = (
  users: Record<string, User>
): UserDataWithId[] => {
  const usersList = Object.entries(users).map(([id, users]) => {
    return {
      ...users,
      id,
    };
  });

  return usersList;
};

export const getUser = (id: string, room: RoomConfig): User | undefined => {
  return room.users.find((user) => user.id === id);
};

export const updateActualUser = (
  userId: string,
  users: User[]
): User[] | undefined => {
  const actualUser = users.find((user) => user.id === userId);
  const actualUserIndex = users.findIndex((user) => user.id === userId);

  if (actualUser && !actualUser.actual) {
    actualUser.actual = true;

    return [
      ...users.slice(0, actualUserIndex),
      actualUser,
      ...users.slice(actualUserIndex + 1),
    ];
  }

  return users;
};

export const getActualAndNextUser = (
  userId: string,
  users: User[]
): { nextUser: User; actualUser: User } => {
  const actualUser = users.find(
    (user) => user.id === userId
  ) as unknown as User;

  const nextUser = users.find(
    (user) => user.position === actualUser.position + 1
  ) as unknown as User;

  const firstUser = users.find(
    (user) => user.position === 1
  ) as unknown as User;
  return { nextUser: nextUser ?? firstUser, actualUser };
};

export const updateUserState = (
  nextUser: User,
  actualUser: User,
  users: User[]
): User[] => {
  const actualUserIndex = users.findIndex((user) => user.id === actualUser?.id);

  const nextUserIndex = users.findIndex((user) => user.id === nextUser?.id);

  actualUser.actual = false;
  nextUser.actual = true;

  return users.map((user, index) => {
    if (index === actualUserIndex) return actualUser;
    if (index === nextUserIndex) return nextUser;
    return user;
  });
};

export const updatePosition = (users: User[]): User[] => {
  return users.map((user, index) => ({ ...user, position: index + 1 }));
};
