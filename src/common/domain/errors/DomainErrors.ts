export abstract class DomainError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, field?: string) {
    super(
      message,
      `VALIDATION_ERROR${field ? `_${field.toUpperCase()}` : ''}`,
      400,
    );
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, identifier: string) {
    super(
      `${resource} with identifier ${identifier} not found`,
      'NOT_FOUND',
      404,
    );
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string = 'Forbidden access') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}

export class BusinessRuleError extends DomainError {
  constructor(message: string, rule: string) {
    super(message, `BUSINESS_RULE_${rule.toUpperCase()}`, 422);
  }
}

export class TenantLimitExceededError extends DomainError {
  constructor(limit: string, current: number, max: number) {
    super(
      `Tenant limit exceeded for ${limit}. Current: ${current}, Max: ${max}`,
      'TENANT_LIMIT_EXCEEDED',
      429,
    );
  }
}
