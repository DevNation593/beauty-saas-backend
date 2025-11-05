import { User, UserRole, UserStatus } from './User';

export interface UserRepository {
  save(user: User): Promise<void>;
  update(user: User): Promise<void>;
  findById(id: string, tenantId: string): Promise<User | null>;
  findByEmail(email: string, tenantId: string): Promise<User | null>;
  findByTenant(
    tenantId: string,
    filters?: UserFilters,
    options?: Record<string, unknown>,
  ): Promise<User[]>;
  findByRole(role: UserRole, tenantId: string): Promise<User[]>;
  findByResetToken(token: string): Promise<User | null>;
  findByEmailVerificationToken(token: string): Promise<User | null>;
  delete(id: string, tenantId: string): Promise<void>;
  count(tenantId: string, filters?: UserFilters): Promise<number>;
  countByTenant(tenantId: string, filters?: UserFilters): Promise<number>;
  getUserStats(tenantId: string): Promise<Record<string, unknown>>;
  findActiveByRole(tenantId: string, role: UserRole): Promise<User[]>;
  getActivityMetrics(
    tenantId: string,
    period?: string,
  ): Promise<Record<string, unknown>>;
}

export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  lastLoginRange?: {
    from?: Date;
    to?: Date;
  };
}

export interface AuthenticationService {
  authenticate(
    email: string,
    password: string,
    tenantId: string,
  ): Promise<AuthResult>;
  refreshToken(refreshToken: string): Promise<TokenPair>;
  logout(userId: string, tenantId: string): Promise<void>;
  changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void>;
  resetPassword(email: string, tenantId: string): Promise<void>;
  confirmPasswordReset(token: string, newPassword: string): Promise<void>;
  verifyEmail(token: string): Promise<void>;
  resendEmailVerification(userId: string, tenantId: string): Promise<void>;
}

export interface AuthResult {
  user: User;
  tokens: TokenPair;
  isFirstLogin: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthorizationService {
  hasPermission(
    userId: string,
    permission: string,
    tenantId: string,
  ): Promise<boolean>;
  getUserPermissions(userId: string, tenantId: string): Promise<string[]>;
  getUserRole(userId: string, tenantId: string): Promise<UserRole>;
  canAccessResource(
    userId: string,
    resource: string,
    action: string,
    tenantId: string,
  ): Promise<boolean>;
}

export interface SessionService {
  createSession(
    userId: string,
    tenantId: string,
    metadata?: SessionMetadata,
  ): Promise<Session>;
  getSession(sessionId: string): Promise<Session | null>;
  updateSession(sessionId: string, updates: Partial<Session>): Promise<void>;
  invalidateSession(sessionId: string): Promise<void>;
  invalidateUserSessions(userId: string, tenantId: string): Promise<void>;
  getActiveSessions(userId: string, tenantId: string): Promise<Session[]>;
}

export interface Session {
  id: string;
  userId: string;
  tenantId: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  lastActivityAt: Date;
  expiresAt: Date;
  createdAt: Date;
}

export interface SessionMetadata {
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
}

export interface TwoFactorService {
  generateSecret(userId: string): Promise<TwoFactorSecret>;
  verifyToken(userId: string, token: string): Promise<boolean>;
  generateBackupCodes(userId: string): Promise<string[]>;
  verifyBackupCode(userId: string, code: string): Promise<boolean>;
  sendSMSCode(userId: string): Promise<void>;
  verifySMSCode(userId: string, code: string): Promise<boolean>;
}

export interface TwoFactorSecret {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface UserAnalyticsService {
  getUserActivityStats(
    tenantId: string,
    period: 'day' | 'week' | 'month',
  ): Promise<UserActivityStats>;
  getLoginHistory(
    userId: string,
    tenantId: string,
    limit?: number,
  ): Promise<LoginRecord[]>;
  getActiveUsers(tenantId: string): Promise<number>;
  getUserGrowth(
    tenantId: string,
    period: 'week' | 'month' | 'year',
  ): Promise<GrowthStats[]>;
  getRoleDistribution(tenantId: string): Promise<Record<UserRole, number>>;
}

export interface UserActivityStats {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  averageSessionDuration: number;
  loginCount: number;
}

export interface LoginRecord {
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  success: boolean;
}

export interface GrowthStats {
  period: string;
  newUsers: number;
  totalUsers: number;
  growthRate: number;
}

export interface UserNotificationService {
  sendWelcomeEmail(user: User): Promise<void>;
  sendEmailVerification(user: User): Promise<void>;
  sendPasswordResetEmail(user: User, resetToken: string): Promise<void>;
  sendPasswordChangedNotification(user: User): Promise<void>;
  sendRoleChangedNotification(
    user: User,
    newRole: UserRole,
    changedBy: string,
  ): Promise<void>;
  sendSecurityAlert(
    user: User,
    alertType: string,
    metadata?: Record<string, unknown>,
  ): Promise<void>;
}
