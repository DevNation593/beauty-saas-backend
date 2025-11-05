export interface IStorageService {
  /**
   * Upload a file to storage
   */
  uploadFile(
    path: string,
    file: Buffer | Blob | File,
    options?: {
      contentType?: string;
      cacheControl?: string;
      metadata?: Record<string, string>;
    },
  ): Promise<string>; // Returns public URL

  /**
   * Download a file from storage
   */
  downloadFile(path: string): Promise<Buffer>;

  /**
   * Delete file(s) from storage
   */
  deleteFiles(paths: string[]): Promise<void>;

  /**
   * Get public URL for a file
   */
  getPublicUrl(path: string): string;

  /**
   * List files in a folder
   */
  listFiles(folder?: string): Promise<
    Array<{
      name: string;
      path: string;
      size: number;
      createdAt: Date;
      updatedAt: Date;
    }>
  >;
}
