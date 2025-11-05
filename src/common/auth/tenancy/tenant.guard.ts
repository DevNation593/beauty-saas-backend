import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantRequest } from './tenant-context.middleware';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<TenantRequest>();

    // Check if route requires tenant
    const requireTenant = this.reflector.getAllAndOverride<boolean>(
      'requireTenant',
      [context.getHandler(), context.getClass()],
    );

    if (!requireTenant) {
      return true; // Route doesn't require tenant
    }

    // Check if tenant is present
    if (!request.tenant) {
      throw new UnauthorizedException(
        'Tenant context is required for this operation',
      );
    }

    // Check if tenant has required module
    const requiredModule = this.reflector.getAllAndOverride<string>(
      'requireModule',
      [context.getHandler(), context.getClass()],
    );

    if (requiredModule && !this.hasModule(request.tenant, requiredModule)) {
      throw new ForbiddenException(
        `Module '${requiredModule}' is not available for this tenant`,
      );
    }

    // Check if tenant has required feature
    const requiredFeature = this.reflector.getAllAndOverride<string>(
      'requireFeature',
      [context.getHandler(), context.getClass()],
    );

    if (requiredFeature && !this.hasFeature(request.tenant, requiredFeature)) {
      throw new ForbiddenException(
        `Feature '${requiredFeature}' is not available for this tenant`,
      );
    }

    return true;
  }

  private hasModule(
    tenant: TenantRequest['tenant'],
    moduleName: string,
  ): boolean {
    if (!tenant?.plan?.modules) {
      return false;
    }
    return tenant.plan.modules.includes(moduleName.toUpperCase());
  }

  private hasFeature(
    tenant: TenantRequest['tenant'],
    featureName: string,
  ): boolean {
    if (!tenant?.plan?.features) {
      return false;
    }
    return tenant.plan.features.includes(featureName.toUpperCase());
  }
}
