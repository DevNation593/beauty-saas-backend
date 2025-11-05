import { BaseEntity } from '../../../common/domain/core/BaseEntity';
import { DomainEvent } from '../../../common/domain/core/DomainEvent';

export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  RECEPTION = 'RECEPTION',
  STAFF = 'STAFF',
  CLIENT = 'CLIENT',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export interface UserProps {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  preferences: Record<string, any>;
  permissions: string[];
  lastLoginAt?: Date;
  emailVerifiedAt?: Date;
  phoneVerifiedAt?: Date;
  twoFactorEnabled: boolean;
  timezone: string;
  locale: string;
  hashedPassword?: string;
  resetPasswordToken?: string;
  resetPasswordExpiresAt?: Date;
  emailVerificationToken?: string;
  isFirstLogin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class UserCreatedEvent implements DomainEvent {
  public readonly type = 'UserCreated';
  public readonly aggregateId: string;
  public readonly occurredAt: Date;

  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly email: string,
    public readonly role: UserRole,
  ) {
    this.aggregateId = userId;
    this.occurredAt = new Date();
  }

  get payload() {
    return {
      userId: this.userId,
      tenantId: this.tenantId,
      email: this.email,
      role: this.role,
    };
  }
}

export class UserRoleChangedEvent implements DomainEvent {
  public readonly type = 'UserRoleChanged';
  public readonly aggregateId: string;
  public readonly occurredAt: Date;

  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly oldRole: UserRole,
    public readonly newRole: UserRole,
  ) {
    this.aggregateId = userId;
    this.occurredAt = new Date();
  }

  get payload() {
    return {
      userId: this.userId,
      tenantId: this.tenantId,
      oldRole: this.oldRole,
      newRole: this.newRole,
    };
  }
}

export class UserLoggedInEvent implements DomainEvent {
  public readonly type = 'UserLoggedIn';
  public readonly aggregateId: string;
  public readonly occurredAt: Date;

  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly ipAddress?: string,
    public readonly userAgent?: string,
  ) {
    this.aggregateId = userId;
    this.occurredAt = new Date();
  }

  get payload() {
    return {
      userId: this.userId,
      tenantId: this.tenantId,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
    };
  }
}

export class UserPasswordChangedEvent implements DomainEvent {
  public readonly type = 'UserPasswordChanged';
  public readonly aggregateId: string;
  public readonly occurredAt: Date;

  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
  ) {
    this.aggregateId = userId;
    this.occurredAt = new Date();
  }

  get payload() {
    return {
      userId: this.userId,
      tenantId: this.tenantId,
    };
  }
}

export class User extends BaseEntity {
  private readonly props: UserProps;

  constructor(props: UserProps, id?: string) {
    super(id || props.id, props.createdAt, props.updatedAt);
    this.props = {
      ...props,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date(),
    };
  }

  // Getters
  get tenantId(): string {
    return this.props.tenantId;
  }

  get email(): string {
    return this.props.email;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get status(): UserStatus {
    return this.props.status;
  }

  get avatar(): string | undefined {
    return this.props.avatar;
  }

  get preferences(): Record<string, any> {
    return this.props.preferences;
  }

  get permissions(): string[] {
    return this.props.permissions;
  }

  get lastLoginAt(): Date | undefined {
    return this.props.lastLoginAt;
  }

  get emailVerifiedAt(): Date | undefined {
    return this.props.emailVerifiedAt;
  }

  get phoneVerifiedAt(): Date | undefined {
    return this.props.phoneVerifiedAt;
  }

  get twoFactorEnabled(): boolean {
    return this.props.twoFactorEnabled;
  }

  get timezone(): string {
    return this.props.timezone;
  }

  get locale(): string {
    return this.props.locale;
  }

  get hashedPassword(): string | undefined {
    return this.props.hashedPassword;
  }

  get resetPasswordToken(): string | undefined {
    return this.props.resetPasswordToken;
  }

  get resetPasswordExpiresAt(): Date | undefined {
    return this.props.resetPasswordExpiresAt;
  }

  get emailVerificationToken(): string | undefined {
    return this.props.emailVerificationToken;
  }

  get isFirstLogin(): boolean {
    return this.props.isFirstLogin;
  }

  public static create(
    tenantId: string,
    email: string,
    firstName: string,
    lastName: string,
    role: UserRole,
    hashedPassword?: string,
  ): User {
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const user = new User({
      id,
      tenantId,
      email: email.toLowerCase().trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
      status: UserStatus.PENDING_VERIFICATION,
      preferences: {},
      permissions: [],
      twoFactorEnabled: false,
      timezone: 'UTC',
      locale: 'en',
      hashedPassword,
      isFirstLogin: true,
      createdAt: now,
      updatedAt: now,
    });

    user.addDomainEvent(new UserCreatedEvent(user.id, tenantId, email, role));

    return user;
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  get isOwner(): boolean {
    return this.props.role === UserRole.OWNER;
  }

  get isManager(): boolean {
    return this.props.role === UserRole.MANAGER;
  }

  get isStaff(): boolean {
    return [UserRole.STAFF, UserRole.RECEPTION].includes(this.props.role);
  }

  get isClient(): boolean {
    return this.props.role === UserRole.CLIENT;
  }

  get canManageUsers(): boolean {
    return [UserRole.OWNER, UserRole.MANAGER].includes(this.props.role);
  }

  get canManageSettings(): boolean {
    return [UserRole.OWNER, UserRole.MANAGER].includes(this.props.role);
  }

  get canAccessPOS(): boolean {
    return [UserRole.OWNER, UserRole.MANAGER, UserRole.RECEPTION].includes(
      this.props.role,
    );
  }

  get canManageInventory(): boolean {
    return [UserRole.OWNER, UserRole.MANAGER].includes(this.props.role);
  }

  get canViewReports(): boolean {
    return [UserRole.OWNER, UserRole.MANAGER].includes(this.props.role);
  }

  public activate(): void {
    if (this.props.status === UserStatus.ACTIVE) return;

    this.props.status = UserStatus.ACTIVE;
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    if (this.props.status === UserStatus.INACTIVE) return;

    this.props.status = UserStatus.INACTIVE;
    this.props.updatedAt = new Date();
  }

  public suspend(): void {
    this.props.status = UserStatus.SUSPENDED;
    this.props.updatedAt = new Date();
  }

  public changeRole(newRole: UserRole, _changedBy: string): void {
    if (this.props.role === newRole) return;

    const oldRole = this.props.role;
    this.props.role = newRole;
    this.updatePermissionsForRole(newRole);
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new UserRoleChangedEvent(this.id, this.props.tenantId, oldRole, newRole),
    );
  }

  public updateProfile(
    updates: Partial<
      Pick<
        UserProps,
        'firstName' | 'lastName' | 'phone' | 'avatar' | 'timezone' | 'locale'
      >
    >,
  ): void {
    Object.assign(this.props, updates);
    this.props.updatedAt = new Date();
  }

  public updatePreferences(preferences: Record<string, any>): void {
    this.props.preferences = { ...this.props.preferences, ...preferences };
    this.props.updatedAt = new Date();
  }

  public addPermission(permission: string): void {
    if (!this.props.permissions.includes(permission)) {
      this.props.permissions.push(permission);
      this.props.updatedAt = new Date();
    }
  }

  public removePermission(permission: string): void {
    const index = this.props.permissions.indexOf(permission);
    if (index > -1) {
      this.props.permissions.splice(index, 1);
      this.props.updatedAt = new Date();
    }
  }

  public hasPermission(permission: string): boolean {
    return this.props.permissions.includes(permission) || this.isOwner;
  }

  public verifyEmail(): void {
    this.props.emailVerifiedAt = new Date();
    this.props.emailVerificationToken = undefined;

    if (this.props.status === UserStatus.PENDING_VERIFICATION) {
      this.props.status = UserStatus.ACTIVE;
    }

    this.props.updatedAt = new Date();
  }

  public verifyPhone(): void {
    this.props.phoneVerifiedAt = new Date();
    this.props.updatedAt = new Date();
  }

  public enableTwoFactor(): void {
    this.props.twoFactorEnabled = true;
    this.props.updatedAt = new Date();
  }

  public disableTwoFactor(): void {
    this.props.twoFactorEnabled = false;
    this.props.updatedAt = new Date();
  }

  public recordLogin(ipAddress?: string, userAgent?: string): void {
    this.props.lastLoginAt = new Date();
    this.props.isFirstLogin = false;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new UserLoggedInEvent(this.id, this.props.tenantId, ipAddress, userAgent),
    );
  }

  public changePassword(hashedPassword: string): void {
    this.props.hashedPassword = hashedPassword;
    this.props.resetPasswordToken = undefined;
    this.props.resetPasswordExpiresAt = undefined;
    this.props.updatedAt = new Date();

    this.addDomainEvent(
      new UserPasswordChangedEvent(this.id, this.props.tenantId),
    );
  }

  public generatePasswordResetToken(): string {
    const token = this.generateRandomToken();
    this.props.resetPasswordToken = token;
    this.props.resetPasswordExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ); // 24 hours
    this.props.updatedAt = new Date();
    return token;
  }

  public generateEmailVerificationToken(): string {
    const token = this.generateRandomToken();
    this.props.emailVerificationToken = token;
    this.props.updatedAt = new Date();
    return token;
  }

  public isPasswordResetTokenValid(token: string): boolean {
    return !!(
      this.props.resetPasswordToken === token &&
      this.props.resetPasswordExpiresAt &&
      this.props.resetPasswordExpiresAt > new Date()
    );
  }

  public isEmailVerificationTokenValid(token: string): boolean {
    return this.props.emailVerificationToken === token;
  }

  private updatePermissionsForRole(role: UserRole): void {
    // Clear existing permissions
    this.props.permissions = [];

    switch (role) {
      case UserRole.OWNER:
        // Owner has all permissions implicitly
        break;

      case UserRole.MANAGER:
        this.props.permissions = [
          'users:read',
          'users:create',
          'users:update',
          'appointments:read',
          'appointments:create',
          'appointments:update',
          'appointments:delete',
          'clients:read',
          'clients:create',
          'clients:update',
          'clients:delete',
          'sales:read',
          'sales:create',
          'inventory:read',
          'inventory:update',
          'reports:read',
          'settings:read',
          'settings:update',
        ];
        break;

      case UserRole.RECEPTION:
        this.props.permissions = [
          'appointments:read',
          'appointments:create',
          'appointments:update',
          'clients:read',
          'clients:create',
          'clients:update',
          'sales:read',
          'sales:create',
          'inventory:read',
        ];
        break;

      case UserRole.STAFF:
        this.props.permissions = [
          'appointments:read',
          'clients:read',
          'sales:read',
        ];
        break;

      case UserRole.CLIENT:
        this.props.permissions = [
          'appointments:read_own',
          'profile:read',
          'profile:update',
        ];
        break;
    }
  }

  private generateRandomToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  // Computed properties
  get isEmailVerified(): boolean {
    return !!this.props.emailVerifiedAt;
  }

  get isPhoneVerified(): boolean {
    return !!this.props.phoneVerifiedAt;
  }

  get daysSinceLastLogin(): number | null {
    if (!this.props.lastLoginAt) return null;

    return Math.floor(
      (Date.now() - this.props.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  get accountAge(): number {
    return Math.floor(
      (Date.now() - this.props.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  // Validation methods
  public canBeDeleted(): boolean {
    // Business rule: Owner cannot be deleted if they are the only owner
    // This would need to be checked at the application level
    return !this.isOwner;
  }

  public canChangeRole(targetRole: UserRole): boolean {
    // Business rules for role changes
    if (this.isOwner && targetRole !== UserRole.OWNER) {
      // Would need to check if there are other owners
      return false;
    }
    return true;
  }

  getProps(): UserProps {
    return { ...this.props };
  }
}
