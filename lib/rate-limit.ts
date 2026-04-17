type Bucket = {
  count: number;
  resetAt: number;
};

const memoryBucket = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  limit = 5,
  windowMs = 15 * 60 * 1000,
) {
  const now = Date.now();
  const current = memoryBucket.get(key);

  if (!current || current.resetAt < now) {
    memoryBucket.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: current.resetAt - now };
  }

  current.count += 1;
  memoryBucket.set(key, current);
  return { allowed: true, remaining: limit - current.count };
}
