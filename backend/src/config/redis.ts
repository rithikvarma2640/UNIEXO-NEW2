console.log("=== ENV CHECK ===");
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "✅ SET" : "❌ MISSING");
console.log("JWT_ACCESS_SECRET:", process.env.JWT_ACCESS_SECRET ? "✅ SET" : "❌ MISSING");
console.log("JWT_REFRESH_SECRET:", process.env.JWT_REFRESH_SECRET ? "✅ SET" : "❌ MISSING");
console.log("SMTP_USER:", process.env.SMTP_USER ? "✅ SET" : "❌ MISSING");
console.log("SMTP_PASS:", process.env.SMTP_PASS ? "✅ SET" : "❌ MISSING");
console.log("SMTP_FROM:", process.env.SMTP_FROM ? "✅ SET" : "❌ MISSING");
console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID ? "✅ SET" : "❌ MISSING");
console.log("RAZORPAY_KEY_SECRET:", process.env.RAZORPAY_KEY_SECRET ? "✅ SET" : "❌ MISSING");
console.log("RAZORPAY_WEBHOOK_SECRET:", process.env.RAZORPAY_WEBHOOK_SECRET ? "✅ SET" : "❌ MISSING");
console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME ? "✅ SET" : "❌ MISSING");
console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY ? "✅ SET" : "❌ MISSING");
console.log("CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "✅ SET" : "❌ MISSING");
console.log("=================");
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
