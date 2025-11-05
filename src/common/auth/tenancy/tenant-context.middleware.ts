import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantProvider } from './tenant.provider';

export interface TenantRequest extends Request {
  tenant?: {
    id: string;
    slug: string;
    name: string;
    plan: {
      id: string;
      name: string;
      modules: string[];
      features: string[];
    };
  };
}

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly tenantProvider: TenantProvider) {}

  async use(req: TenantRequest, res: Response, next: NextFunction) {
    try {
      // Extract tenant identifier from subdomain, header, or path
      const tenantSlug = this.extractTenantSlug(req);

      if (tenantSlug) {
        const tenant = await this.tenantProvider.getTenantBySlug(tenantSlug);
        if (tenant) {
          req.tenant = tenant;
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  }

  private extractTenantSlug(req: Request): string | null {
    // 1. Try from X-Tenant-Slug header (for API calls)
    const headerSlug = req.headers['x-tenant-slug'] as string;
    if (headerSlug) return headerSlug;

    // 2. Try from subdomain (for web interface)
    const host = req.headers.host;
    if (host) {
      const subdomain = host.split('.')[0];
      // Avoid common subdomains
      if (!['www', 'api', 'admin', 'app'].includes(subdomain)) {
        return subdomain;
      }
    }

    // 3. Try from path parameter (for single-domain setups)
    const pathSlug = req.params.tenant;
    if (pathSlug) return pathSlug;

    return null;
  }
}
