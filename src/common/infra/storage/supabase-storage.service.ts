import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IStorageService } from './storage.interface';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class SupabaseStorageService implements IStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private readonly bucketName: string;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {
    this.bucketName =
      this.configService.get<string>('supabase.storage.bucket') ||
      'beauty-saas';
  }

  async uploadFile(
    path: string,
    file: Buffer | Blob | File,
    options?: {
      contentType?: string;
      cacheControl?: string;
      metadata?: Record<string, string>;
    },
  ): Promise<string> {
    try {
      await this.supabaseService.uploadFile(this.bucketName, path, file, {
        contentType: options?.contentType,
        cacheControl: options?.cacheControl || '3600',
        upsert: true,
      });

      return this.getPublicUrl(path);
    } catch (error) {
      this.logger.error(`Failed to upload file ${path}:`, error);
      throw error;
    }
  }

  async downloadFile(path: string): Promise<Buffer> {
    try {
      const blob = await this.supabaseService.downloadFile(
        this.bucketName,
        path,
      );
      return Buffer.from(await blob.arrayBuffer());
    } catch (error) {
      this.logger.error(`Failed to download file ${path}:`, error);
      throw error;
    }
  }

  async deleteFiles(paths: string[]): Promise<void> {
    try {
      await this.supabaseService.deleteFile(this.bucketName, paths);
    } catch (error) {
      this.logger.error(`Failed to delete files:`, error);
      throw error;
    }
  }

  getPublicUrl(path: string): string {
    return this.supabaseService.getPublicUrl(this.bucketName, path);
  }

  async listFiles(folder?: string): Promise<
    Array<{
      name: string;
      path: string;
      size: number;
      createdAt: Date;
      updatedAt: Date;
    }>
  > {
    try {
      const result = await this.supabaseService.listFiles(
        this.bucketName,
        folder,
      );

      if (!result.data) {
        return [];
      }

      return (result.data as Array<{
        name: string;
        created_at: string;
        updated_at: string;
        metadata?: { size?: number };
      }>).map((file) => ({
        name: file.name,
        path: folder ? `${folder}/${file.name}` : file.name,
        size: file.metadata?.size || 0,
        createdAt: new Date(file.created_at),
        updatedAt: new Date(file.updated_at),
      }));
    } catch (error) {
      this.logger.error(`Failed to list files in folder ${folder}:`, error);
      throw error;
    }
  }
}
