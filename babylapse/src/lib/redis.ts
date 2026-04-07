import { Redis } from '@upstash/redis'

let redisInstance: Redis | null = null

export function getRedis(): Redis {
  if (!redisInstance) {
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!upstashUrl || !upstashToken) {
      throw new Error(
        'Missing Upstash Redis configuration. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.'
      )
    }

    redisInstance = new Redis({
      url: upstashUrl,
      token: upstashToken,
    })
  }
  return redisInstance
}

export async function closeRedis() {
  // Upstash Redis doesn't require explicit cleanup in serverless environments
  redisInstance = null
}
