import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { TenantRequest } from './tenant-context.middleware';

// Decorator to mark routes that require a tenant context
export const RequireTenant = () => SetMetadata('requireTenant', true);

// Decorator to inject current tenant information into route handlers
export const CurrentTenant = createParamDecorator(
  (property: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<TenantRequest>();
    const tenant = request.tenant;

    if (!tenant) {
      return null;
    }

    return property ? tenant[property as keyof typeof tenant] : tenant;
  },
);

// Decorator to get the full tenant object
export const Tenant = () => CurrentTenant();

// Decorator to check if tenant has specific module enabled
export const RequireModule = (moduleName: string) =>
  SetMetadata('requireModule', moduleName);

// Decorator to check if tenant has specific feature enabled
export const RequireFeature = (featureName: string) =>
  SetMetadata('requireFeature', featureName);
