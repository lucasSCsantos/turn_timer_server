export interface UserData {
  username: string;
  role: string;
  number: number;
}

export interface UserDataWithId extends UserData {
  id: string;
}

export const validateUsername = (
  users: Record<string, Record<string, UserData>>,
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
  users: Record<string, UserData>
): UserDataWithId[] => {
  const usersList = Object.entries(users).map(([id, users]) => {
    return {
      ...users,
      id,
    };
  });

  return usersList;
};
