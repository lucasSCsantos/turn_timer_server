import redisClient from '../config/redis';

export const save = async (key: string, value: any): Promise<void> => {
  await redisClient.set(key, JSON.stringify(value));
};

export const recover = async <T>(key: string): Promise<T | null> => {
  const data = await redisClient.get(key);
  if (!data) {
    return null;
  }

  return JSON.parse(data) as T;
};

export const invalidate = async (key: string): Promise<void> => {
  await redisClient.del(key);
};
