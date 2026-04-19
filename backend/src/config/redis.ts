import Redis, { RedisOptions } from 'ioredis';
import RedisMock from 'ioredis-mock';
import { env } from './env';
import { logger } from './logger';

const redisOptions: RedisOptions = env.REDIS_URL ?
  (env.REDIS_URL.startsWith('rediss://') ? { tls: { rejectUnauthorized: false }, maxRetriesPerRequest: 3, enableOfflineQueue: false, commandTimeout: 5000 } : { maxRetriesPerRequest: 3, enableOfflineQueue: false, commandTimeout: 5000 })
  : {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    ...(env.REDIS_PASSWORD && { password: env.REDIS_PASSWORD }),
    ...(env.REDIS_TLS === 'true' && { tls: { rejectUnauthorized: false } }),
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
    commandTimeout: 5000,
    retryStrategy(times: number) {
      const delay = Math.min(times * 200, 2000);
      return delay;
    },
  };

export const redis = env.USE_MOCK_REDIS === 'true'
  ? new (RedisMock as any)() as Redis
  : (env.REDIS_URL ? new Redis(env.REDIS_URL, redisOptions) : new Redis(redisOptions));

redis.on('connect', () => {
  logger.info(env.USE_MOCK_REDIS === 'true' ? '✅ Mock Redis connected' : '✅ Redis connected');
});

redis.on('error', (err) => {
  logger.error('❌ Redis connection error:', err);
});
