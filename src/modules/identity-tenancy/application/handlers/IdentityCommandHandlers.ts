import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  LoginCommand,
  RegisterCommand,
  ChangePasswordCommand,
  ForgotPasswordCommand,
  ResetPasswordCommand,
  UpdateProfileCommand,
  CreateTenantCommand,
} from '../commands/IdentityCommands';
import { SupabaseService } from '../../../../common/infra/supabase/supabase.service';
import { PrismaService } from '../../../../common/infra/database/prisma.service';
import { User, Tenant, Plan } from '@prisma/client';

export type UserWithTenant = User & {
  tenant: Tenant & {
    plan: Plan;
  };
};

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: UserWithTenant;
  tenant: Tenant & { plan: Plan };
}

export interface TenantCreationResult {
  tenant: Tenant & { plan: Plan };
  owner: User;
}

export interface SuccessResult {
  success: boolean;
}

@Injectable()
@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const { email, password } = command;

    // Authenticate with Supabase
    const authResult = await this.supabaseService.signIn(email, password);
    if (!authResult.session) {
      throw new BadRequestException('Invalid credentials');
    }

    // Get user from database with relations
    const user = await this.prisma.user.findFirst({
      where: { email },
      include: {
        tenant: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!user) {
      throw new BadRequestException('User not found in database');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      accessToken: authResult.session.access_token,
      refreshToken: authResult.session.refresh_token,
      user: user as UserWithTenant,
      tenant: user.tenant,
    };
  }
}

@Injectable()
@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand> {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: RegisterCommand): Promise<LoginResult> {
    const { email, password, firstName, lastName, phone } = command;

    // For now, we assume tenantId is provided separately or we have a current tenant context
    // This is a simplified implementation
    const defaultTenantId = 'temp-tenant-id'; // This should come from context

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Create user in Supabase Auth
    const authResult = await this.supabaseService.signUp(email, password);
    if (!authResult.user || !authResult.session) {
      throw new BadRequestException('Failed to create user in authentication system');
    }

    // Create user in database with Supabase user ID
    const user = await this.prisma.user.create({
      data: {
        id: authResult.user.id, // Use Supabase user ID
        email,
        firstName,
        lastName,
        phone,
        tenantId: defaultTenantId,
        role: 'STAFF',
        status: 'ACTIVE',
        // Note: No password field - Supabase handles authentication
      },
      include: {
        tenant: {
          include: {
            plan: true,
          },
        },
      },
    });

    return {
      accessToken: authResult.session.access_token,
      refreshToken: authResult.session.refresh_token,
      user: user as UserWithTenant,
      tenant: user.tenant,
    };
  }
}

@Injectable()
@CommandHandler(ChangePasswordCommand)
export class ChangePasswordHandler
  implements ICommandHandler<ChangePasswordCommand>
{
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: ChangePasswordCommand): Promise<SuccessResult> {
    const { userId, newPassword } = command;

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Update password in Supabase Auth using admin client
    const { error } = await this.supabaseService
      .getAdminClient()
      .auth.admin.updateUserById(userId, {
        password: newPassword,
      });

    if (error) {
      throw new BadRequestException(
        `Failed to change password: ${error.message}`,
      );
    }

    // Update isFirstLogin flag
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isFirstLogin: false,
      },
    });

    return { success: true };
  }
}

@Injectable()
@CommandHandler(ForgotPasswordCommand)
export class ForgotPasswordHandler
  implements ICommandHandler<ForgotPasswordCommand>
{
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: ForgotPasswordCommand): Promise<SuccessResult> {
    const { email } = command;

    // Find user by email (across all tenants for simplicity)
    const user = await this.prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return { success: true };
    }

    // Send password reset email via Supabase
    // Supabase will send the email automatically
    const { error } = await this.supabaseService
      .getClient()
      .auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.APP_URL}/reset-password`,
      });

    if (error) {
      // Don't reveal error to user for security
      console.error('Failed to send reset email:', error);
    }

    return { success: true };
  }
}

@Injectable()
@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler
  implements ICommandHandler<ResetPasswordCommand>
{
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: ResetPasswordCommand): Promise<SuccessResult> {
    const { token, newPassword } = command;

    // With Supabase, the token comes from the email link
    // User must be authenticated with that token to change password
    // This requires the token to be verified first

    // For now, we'll use the admin client to update the password
    // In a real implementation, the token should be validated first
    const { error } = await this.supabaseService
      .getClient()
      .auth.updateUser({
        password: newPassword,
      });

    if (error) {
      throw new BadRequestException('Failed to reset password');
    }

    return { success: true };
  }
}

@Injectable()
@CommandHandler(UpdateProfileCommand)
export class UpdateProfileHandler
  implements ICommandHandler<UpdateProfileCommand>
{
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateProfileCommand): Promise<User> {
    const { userId, firstName, lastName, phone, avatar, timezone, locale } =
      command;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        phone,
        avatar,
        timezone,
        locale,
      },
    });

    return user;
  }
}

@Injectable()
@CommandHandler(CreateTenantCommand)
export class CreateTenantHandler
  implements ICommandHandler<CreateTenantCommand>
{
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: CreateTenantCommand): Promise<TenantCreationResult> {
    const {
      name,
      slug,
      planId,
      ownerEmail,
      ownerPassword,
      ownerFirstName,
      ownerLastName,
    } = command;

    // Check if slug is available
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      throw new ConflictException('Tenant slug already exists');
    }

    // Get or create default plan
    let plan: Plan | null = null;
    if (planId && planId !== 'default-plan') {
      plan = await this.prisma.plan.findUnique({
        where: { id: planId },
      });
      if (!plan) {
        throw new BadRequestException('Plan not found');
      }
    } else {
      plan = await this.prisma.plan.findFirst({
        where: { name: 'Starter' },
      });

      if (!plan) {
        plan = await this.prisma.plan.create({
          data: {
            name: 'Starter',
            description: 'Starter plan for new tenants',
            price: 0,
            currency: 'USD',
            interval: 'MONTHLY',
            maxUsers: 2,
            maxMessages: 500,
            maxStorage: BigInt(5368709120), // 5GB
            maxAppointments: 1000,
            features: [],
            modules: ['AGENDA', 'CRM'],
          },
        });
      }
    }

    if (!plan) {
      throw new BadRequestException('Unable to determine plan for tenant');
    }

    // Create user in Supabase Auth first
    const authResult = await this.supabaseService.signUp(
      ownerEmail,
      ownerPassword,
    );
    if (!authResult.user) {
      throw new BadRequestException('Failed to create owner user in authentication system');
    }

    // Create tenant
    const tenant = await this.prisma.tenant.create({
      data: {
        name,
        slug,
        planId: plan.id,
        status: 'ACTIVE',
        email: ownerEmail,
        phone: null,
        address: null,
        city: null,
        state: null,
        country: null,
        timezone: 'UTC',
        locale: 'en',
        domain: null,
        logoUrl: null,
        billingEmail: null,
        taxId: null,
        subscriptionStartDate: new Date(),
        subscriptionEndDate: null,
        trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
        maxUsers: plan.maxUsers,
        maxClients: 500,
        maxLocations: 1,
        features: plan.features,
        isActive: true,
        settings: {},
      },
      include: {
        plan: true,
      },
    });

    // Create owner user in database with Supabase user ID
    const owner = await this.prisma.user.create({
      data: {
        id: authResult.user.id, // Use Supabase user ID
        email: ownerEmail,
        firstName: ownerFirstName,
        lastName: ownerLastName,
        role: 'OWNER',
        status: 'ACTIVE',
        tenantId: tenant.id,
        permissions: ['*'],
      },
    });

    return { tenant: tenant as TenantCreationResult['tenant'], owner };
  }
}
