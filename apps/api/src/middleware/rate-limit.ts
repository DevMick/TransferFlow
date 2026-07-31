import type { Context, Next } from 'hono';

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitStore>();

/**
 * Simple in-memory rate limiting middleware
 * Limits requests to 100 requests per 15 minutes per IP address
 */
export const rateLimit = (options: { limit?: number; windowMs?: number } = {}) => {
  const limit = options.limit ?? 100;
  const windowMs = options.windowMs ?? 15 * 60 * 1000; // 15 minutes

  return async (c: Context, next: Next) => {
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const now = Date.now();

    const record = store.get(ip);

    if (!record || now > record.resetTime) {
      // Reset or create new record
      store.set(ip, {
        count: 1,
        resetTime: now + windowMs,
      });
      await next();
      return;
    }

    if (record.count >= limit) {
      const resetIn = Math.ceil((record.resetTime - now) / 1000);
      c.header('X-RateLimit-Limit', limit.toString());
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', resetIn.toString());

      return c.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${resetIn} seconds.`,
        },
        429,
      );
    }

    record.count++;
    store.set(ip, record);

    c.header('X-RateLimit-Limit', limit.toString());
    c.header('X-RateLimit-Remaining', (limit - record.count).toString());
    c.header('X-RateLimit-Reset', Math.ceil((record.resetTime - now) / 1000).toString());

    await next();
  };
};
