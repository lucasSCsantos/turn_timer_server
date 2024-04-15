export interface RoomConfig {
  id: string;
  users: User[];
  type: string;
  time: number;
  access: string;
  url: string;
  live: boolean;
  password: string;
}

export interface User {
  id: string;
  username: string;
  role: string;
  playing: boolean;
  next: boolean;
}
