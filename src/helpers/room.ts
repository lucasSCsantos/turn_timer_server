export const setRoomConfig = (
  roomId: string,
  user: { username: string; id: string },
  object: Record<string, any>
): object => {
  return {
    ...object,
    id: roomId,
    users: [
      {
        ...user,
        role: 'ADMIN',
        number: 1,
      },
    ],
    url: 'http://localhost:3000/' + roomId,
  };
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
