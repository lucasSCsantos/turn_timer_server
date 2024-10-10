export interface RoomConfig {
  id: string;
  users: User[];
  type: string;
  time: number;
  // access: string;
  url: string;
  live: boolean;
  // password: string;
  round: number;
}

export interface User {
  id: string;
  username: string;
  role: 'ADMIN' | 'USER';
  playing: boolean;
  position: number;
  next: boolean;
  actual: boolean;
}
