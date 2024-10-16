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
  id: string;
  time: number;
}

export interface EndGameEventData {
  id: string;
}

export interface StopEventData {
  id: string;
  time: number;
}

export interface ExitRoomData {
  id: string;
  userId: string;
}

export interface ChangeTurnEventData {
  id: string;
  number: number;
}

export interface RestartTimerEventData {
  id: string;
  userId: string;
}

export interface InviteEventData {
  inviteId: string;
  username: string;
}

export interface RemovePlayerEventData {
  id: string;
  userId: string;
}
