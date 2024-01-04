declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ENCRYPT_KEY: string;
      PORT: number;
    }
  }
}

export {};
