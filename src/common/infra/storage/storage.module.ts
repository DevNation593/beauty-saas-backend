import { Module, Global } from '@nestjs/common';
import { SupabaseStorageService } from './supabase-storage.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Global()
@Module({
  imports: [SupabaseModule],
  providers: [
    {
      provide: 'IStorageService',
      useClass: SupabaseStorageService,
    },
  ],
  exports: ['IStorageService'],
})
export class StorageModule {}
