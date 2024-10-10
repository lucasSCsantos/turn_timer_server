import { type User } from './redis';

export interface JoinRoomEventData {
  room: string;
  username: string;
  password: string;
  access: 'public' | 'private';
}

export interface ChangeOrderEventData {
  roomId: string;
  userId: string;
  users: User[];
}

export interface StartEventData {
  roomId: string;
  time: number;
}

export interface EndGameEventData {
  roomId: string;
}

export interface StopEventData {
  roomId: string;
  time: number;
}

export interface ExitRoomData {
  roomId: string;
  userId: string;
}

export interface ChangeTurnEventData {
  roomId: string;
  number: number;
}

export interface RestartTimerEventData {
  roomId: string;
  userId: string;
}

export interface InviteEventData {
  inviteId: string;
  username: string;
}

export interface RemovePlayerEventData {
  roomId: string;
  userId: string;
}
