export interface JoinRoomEventData {
  roomId: string;
  username: string;
}

export interface ChangeTurnEventData {
  roomId: string;
  number: number;
}
