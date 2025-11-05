// User Queries
export class GetUserProfileQuery {
  constructor(public readonly userId: string) {}
}

export class GetUserByEmailQuery {
  constructor(
    public readonly email: string,
    public readonly tenantId?: string,
  ) {}
}

export class GetUsersByTenantQuery {
  constructor(
    public readonly tenantId: string,
    public readonly page?: number,
    public readonly limit?: number,
    public readonly search?: string,
    public readonly role?: string,
    public readonly status?: string,
  ) {}
}

// Tenant Queries
export class GetTenantQuery {
  constructor(public readonly tenantId: string) {}
}

export class GetTenantBySlugQuery {
  constructor(public readonly slug: string) {}
}

export class GetTenantsQuery {
  constructor(
    public readonly page?: number,
    public readonly limit?: number,
    public readonly search?: string,
    public readonly status?: string,
  ) {}
}

// Authentication Queries
export class ValidateUserQuery {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {}
}

export class ValidateTokenQuery {
  constructor(public readonly token: string) {}
}

export class GetUserPermissionsQuery {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
  ) {}
}
