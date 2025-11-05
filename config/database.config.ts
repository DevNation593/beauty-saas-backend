import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url:
    process.env.DATABASE_URL ||
    'postgresql://user:password@localhost:5432/beauty_saas',
  type: 'postgresql',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
}));
