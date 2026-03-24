import { AppError } from './errors.ts'

/**
 * Simple rate limiter using Upstash Redis REST API.
 * Uses a sliding window counter per key.
 *
 * @param key       Unique identifier (e.g. `upload:${userId}`)
 * @param limit     Max requests allowed in the window
 * @param windowSecs  Window duration in seconds
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSecs: number
): Promise<void> {
  const redisUrl = Deno.env.get('UPSTASH_REDIS_REST_URL')
  const redisToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN')

  if (!redisUrl || !redisToken) {
    // Skip rate limiting if Redis is not configured (dev mode)
    console.warn('[rateLimit] Upstash Redis not configured, skipping rate limit')
    return
  }

  const redisKey = `vaultshare:rl:${key}`

  // INCR the key
  const incrRes = await fetch(`${redisUrl}/INCR/${redisKey}`, {
    headers: { Authorization: `Bearer ${redisToken}` },
  })
  const incrData = await incrRes.json()
  const count = incrData.result as number

  // Set TTL on first request in window
  if (count === 1) {
    await fetch(`${redisUrl}/EXPIRE/${redisKey}/${windowSecs}`, {
      headers: { Authorization: `Bearer ${redisToken}` },
    })
  }

  if (count > limit) {
    throw new AppError(
      `Rate limit exceeded. Max ${limit} requests per ${windowSecs}s.`,
      429
    )
  }
}
