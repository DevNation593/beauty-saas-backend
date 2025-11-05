import { registerAs } from '@nestjs/config';

export default registerAs('supabase', () => ({
  url: process.env.SUPABASE_URL || '',
  anonKey: process.env.SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  jwtSecret: process.env.SUPABASE_JWT_SECRET || '',
  storage: {
    bucket: process.env.SUPABASE_STORAGE_BUCKET || 'beauty-saas',
    publicUrl: process.env.SUPABASE_STORAGE_PUBLIC_URL || '',
  },
}));
