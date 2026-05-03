/* eslint-disable @typescript-eslint/no-explicit-any */
const memoryCache = new Map<string, { data: any; expires: number }>();

export const cacheGet = async (key: string) => {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expires) {
    memoryCache.delete(key);
    return null;
  }
  return item.data;
};

export const cacheSet = async (key: string, value: any, ttl = 300) => {
  memoryCache.set(key, { data: value, expires: Date.now() + ttl * 1000 });
};

export const cacheDelete = async (key: string) => {
  memoryCache.delete(key);  
};
