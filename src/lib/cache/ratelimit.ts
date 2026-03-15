import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let _ratelimit: Ratelimit | null = null;

export function getRatelimit(): Ratelimit | null {
  if (_ratelimit) return _ratelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || url.includes('placeholder') || !token || token.includes('placeholder')) {
    return null;
  }

  _ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 requests/minute per IP
    analytics: false,
  });

  return _ratelimit;
}

export async function checkRateLimit(identifier: string): Promise<{ allowed: boolean; remaining: number }> {
  const rl = getRatelimit();
  if (!rl) return { allowed: true, remaining: 999 };

  try {
    const { success, remaining } = await rl.limit(identifier);
    return { allowed: success, remaining };
  } catch {
    return { allowed: true, remaining: 999 };
  }
}
