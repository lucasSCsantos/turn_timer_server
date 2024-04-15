import { type User } from '../@types/redis';

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
