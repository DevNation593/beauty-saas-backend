import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiRateLimitMiddleware implements NestMiddleware {
  private requestCounts = new Map<
    string,
    { count: number; resetTime: number }
  >();

  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = this.configService.get('app.throttleLimit', 100);

    // Clean up old entries
    this.cleanupOldEntries(now, windowMs);

    const clientData = this.requestCounts.get(clientIp);

    if (!clientData || now > clientData.resetTime) {
      // First request or window expired
      this.requestCounts.set(clientIp, {
        count: 1,
        resetTime: now + windowMs,
      });
    } else {
      // Increment count
      clientData.count += 1;

      if (clientData.count > maxRequests) {
        res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Maximum ${maxRequests} requests per minute.`,
          retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
        });
        return;
      }
    }

    // Add rate limit headers
    const remaining = Math.max(0, maxRequests - (clientData?.count || 1));
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader(
      'X-RateLimit-Reset',
      Math.ceil((clientData?.resetTime || now + windowMs) / 1000),
    );

    next();
  }

  private cleanupOldEntries(now: number, windowMs: number) {
    for (const [key, data] of this.requestCounts.entries()) {
      if (now > data.resetTime) {
        this.requestCounts.delete(key);
      }
    }
  }
}
