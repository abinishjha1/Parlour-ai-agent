import { Redis } from "@upstash/redis";

// Fallback to empty string for local dev if env vars are missing
// Upstash Redis provides very fast key-value store for caching and rate limiting
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

/**
 * Helper to cache a function's result in Redis
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  // If no Redis URL is provided, just return the fetcher (local dev fallback)
  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return fetcher();
  }

  try {
    const cached = await redis.get<T>(key);
    if (cached) {
      return cached;
    }

    const data = await fetcher();
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
    return data;
  } catch (error) {
    console.error(`Redis Cache Error for key ${key}:`, error);
    // Fallback to fetcher if Redis fails
    return fetcher();
  }
}
