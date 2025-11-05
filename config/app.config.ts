import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME || 'Beauty SaaS',
  version: process.env.APP_VERSION || '1.0.0',
  port: parseInt(process.env.PORT || '3000', 10),
  env: process.env.NODE_ENV || 'development',
  url: process.env.APP_URL || 'http://localhost:3000',

  // Security
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',

  // Rate limiting
  throttleTtl: parseInt(process.env.THROTTLE_TTL || '60', 10),
  throttleLimit: parseInt(process.env.THROTTLE_LIMIT || '10', 10),

  // File uploads
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
  allowedFileTypes: (
    process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,pdf'
  ).split(','),
}));
