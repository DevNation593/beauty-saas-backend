// Authentication Commands
export class LoginCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {}
}

export class RegisterCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly tenantName: string,
    public readonly phone?: string,
  ) {}
}

export class ChangePasswordCommand {
  constructor(
    public readonly userId: string,
    public readonly currentPassword: string,
    public readonly newPassword: string,
  ) {}
}

export class ForgotPasswordCommand {
  constructor(public readonly email: string) {}
}

export class ResetPasswordCommand {
  constructor(
    public readonly token: string,
    public readonly newPassword: string,
  ) {}
}

export class UpdateProfileCommand {
  constructor(
    public readonly userId: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly phone?: string,
    public readonly avatar?: string,
    public readonly timezone?: string,
    public readonly locale?: string,
  ) {}
}

// Tenant Commands
export class CreateTenantCommand {
  constructor(
    public readonly name: string,
    public readonly slug: string,
    public readonly planId: string,
    public readonly ownerEmail: string,
    public readonly ownerPassword: string,
    public readonly ownerFirstName: string,
    public readonly ownerLastName: string,
  ) {}
}

export class UpdateTenantCommand {
  constructor(
    public readonly tenantId: string,
    public readonly name?: string,
    public readonly domain?: string,
    public readonly timezone?: string,
    public readonly currency?: string,
    public readonly locale?: string,
    public readonly settings?: Record<string, unknown>,
  ) {}
}

// User Management Commands
export class CreateUserCommand {
  constructor(
    public readonly tenantId: string,
    public readonly email: string,
    public readonly password: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly role: string,
    public readonly phone?: string,
    public readonly permissions?: string[],
  ) {}
}

export class UpdateUserCommand {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly phone?: string,
    public readonly role?: string,
    public readonly status?: string,
    public readonly permissions?: string[],
  ) {}
}

export class DeactivateUserCommand {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
  ) {}
}
