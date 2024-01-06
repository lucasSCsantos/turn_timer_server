export interface JoinRoomEventData {
  roomId: string;
  username: string;
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
