export const validateUsername = (
  users: Record<
    string,
    Record<
      string,
      {
        username: string;
        role: string;
        number: number;
      }
    >
  >,
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
