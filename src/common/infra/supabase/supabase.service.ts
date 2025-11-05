import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: SupabaseClient;
  private adminClient: SupabaseClient;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const url = this.configService.get<string>('supabase.url');
    const anonKey = this.configService.get<string>('supabase.anonKey');
    const serviceRoleKey = this.configService.get<string>(
      'supabase.serviceRoleKey',
    );

    if (!url || !anonKey) {
      this.logger.warn('Supabase URL or Anon Key not configured');
      return;
    }

    // Cliente público (usa anon key, respeta RLS)
    this.supabase = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
      },
    });

    // Cliente admin (usa service role key, bypassa RLS)
    if (serviceRoleKey) {
      this.adminClient = createClient(url, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }

    this.logger.log('Supabase clients initialized');
  }

  /**
   * Get public client (respeta RLS, para operaciones de usuario)
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Get admin client (bypassa RLS, para operaciones administrativas)
   */
  getAdminClient(): SupabaseClient {
    if (!this.adminClient) {
      throw new Error(
        'Admin client not configured. Set SUPABASE_SERVICE_ROLE_KEY.',
      );
    }
    return this.adminClient;
  }

  /**
   * Authenticate with email/password
   */
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(`Supabase sign in failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Sign up new user
   */
  async signUp(
    email: string,
    password: string,
    metadata?: Record<string, unknown>,
  ) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });

    if (error) {
      throw new Error(`Supabase sign up failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Sign out
   */
  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw new Error(`Supabase sign out failed: ${error.message}`);
    }
  }

  /**
   * Get current user from access token
   */
  async getUserFromToken(token: string): Promise<User | null> {
    const { data, error } = await this.supabase.auth.getUser(token);

    if (error) {
      this.logger.warn(`Failed to get user from token: ${error.message}`);
      return null;
    }

    return data.user;
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<boolean> {
    const user = await this.getUserFromToken(token);
    return user !== null;
  }

  /**
   * Storage: Upload file to bucket
   */
  async uploadFile(
    bucketName: string,
    path: string,
    file: Buffer | Blob | File,
    options?: { contentType?: string; cacheControl?: string; upsert?: boolean },
  ) {
    const { data, error } = await this.adminClient.storage
      .from(bucketName)
      .upload(path, file, options);

    if (error) {
      throw new Error(`File upload failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Storage: Get public URL for a file
   */
  getPublicUrl(bucketName: string, path: string): string {
    const { data } = this.supabase.storage.from(bucketName).getPublicUrl(path);
    return data.publicUrl;
  }

  /**
   * Storage: Download file
   */
  async downloadFile(bucketName: string, path: string) {
    const { data, error } = await this.supabase.storage
      .from(bucketName)
      .download(path);

    if (error) {
      throw new Error(`File download failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Storage: Delete file
   */
  async deleteFile(
    bucketName: string,
    paths: string[],
  ): Promise<{ data: { name: string }[] | null; error: Error | null }> {
    const { data, error } = await this.adminClient.storage
      .from(bucketName)
      .remove(paths);

    if (error) {
      throw new Error(`File deletion failed: ${error.message}`);
    }

    return { data, error: null };
  }

  /**
   * Storage: List files in folder
   */
  async listFiles(
    bucketName: string,
    folder?: string,
  ): Promise<{ data: unknown[] | null; error: Error | null }> {
    const { data, error } = await this.supabase.storage
      .from(bucketName)
      .list(folder);

    if (error) {
      throw new Error(`List files failed: ${error.message}`);
    }

    return { data, error: null };
  }
}
