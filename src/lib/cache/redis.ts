import { Redis } from '@upstash/redis';

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (_redis) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || url.includes('placeholder') || !token || token.includes('placeholder')) {
    return null; // Redis not configured — run without cache
  }

  _redis = new Redis({ url, token });
  return _redis;
}

const SEARCH_TTL = 60 * 30;       // 30 minutes
const AUTOCOMPLETE_TTL = 60 * 60 * 24; // 24 hours

function hashSearchQuery(params: Record<string, unknown>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${JSON.stringify(params[k])}`)
    .join('&');
  // Simple deterministic hash
  let h = 0;
  for (let i = 0; i < sorted.length; i++) {
    h = (Math.imul(31, h) + sorted.charCodeAt(i)) | 0;
  }
  return `search:${Math.abs(h).toString(36)}`;
}

export async function getCachedSearch<T>(params: Record<string, unknown>): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const key = hashSearchQuery(params);
    return await redis.get<T>(key);
  } catch (err) {
    console.warn('[Cache] getCachedSearch error:', err);
    return null;
  }
}

export async function setCachedSearch<T>(params: Record<string, unknown>, value: T): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    const key = hashSearchQuery(params);
    await redis.set(key, value, { ex: SEARCH_TTL });
  } catch (err) {
    console.warn('[Cache] setCachedSearch error:', err);
  }
}

export async function getCachedAutocomplete<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    return await redis.get<T>(`autocomplete:${key}`);
  } catch {
    return null;
  }
}

export async function setCachedAutocomplete<T>(key: string, value: T): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(`autocomplete:${key}`, value, { ex: AUTOCOMPLETE_TTL });
  } catch {
    // Non-critical
  }
}

export async function invalidateSearchCache(): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    const keys = await redis.keys('search:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.warn('[Cache] invalidateSearchCache error:', err);
  }
}
