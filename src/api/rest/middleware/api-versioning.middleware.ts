import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ApiVersioningMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract version from header or URL
    const versionFromHeader = req.headers['api-version'] as string;
    const versionFromUrl = req.url.match(/^\/v(\d+)\//)?.[1];

    // Set default version if none provided
    const apiVersion = versionFromHeader || versionFromUrl || '1';

    // Add version to request context
    (req as any).apiVersion = apiVersion;

    // Add version to response headers
    res.setHeader('API-Version', apiVersion);
    res.setHeader('Supported-Versions', '1');

    next();
  }
}
