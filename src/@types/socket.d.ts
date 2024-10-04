export interface JoinRoomEventData {
  room: string;
  username: string;
  password: string;
  access: 'public' | 'private';
}

export interface ExitRoomData {
  id: string;
}

export interface ChangeTurnEventData {
  roomId: string;
  number: number;
}

export interface RestartTimerEventData {
  roomId: string;
  userId: string;
}

export interface ChangeOrderEventData {
  roomId: string;
  admin: boolean;
  newOrder: Array<{ id: string; number: number }>;
}

export interface InviteEventData {
  inviteId: string;
  username: string;
}
