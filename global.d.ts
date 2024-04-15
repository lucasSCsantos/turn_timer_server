declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ENCRYPT_KEY: string;
      PORT: number;
      REDIS_URL: string;
      REDIS_HOST: string;
      REDIS_PORT: number;
      REDIS_PASSWORD: string;
      REDIS_USERNAME: string;
    }
  }
}

export {};
