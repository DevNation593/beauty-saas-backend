import { registerAs } from '@nestjs/config';

export default registerAs('cache', () => ({
  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  // Cache TTL settings (in seconds)
  ttl: {
    default: parseInt(process.env.CACHE_TTL || '300', 10), // 5 minutes
    short: parseInt(process.env.CACHE_TTL_SHORT || '60', 10), // 1 minute
    long: parseInt(process.env.CACHE_TTL_LONG || '3600', 10), // 1 hour
    user: parseInt(process.env.CACHE_TTL_USER || '1800', 10), // 30 minutes
    tenant: parseInt(process.env.CACHE_TTL_TENANT || '7200', 10), // 2 hours
  },
}));
