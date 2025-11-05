import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Request,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { SupabaseAuthGuard } from '../../../common/auth/supabase/supabase-auth.guard';
import {
  LoginDto,
  RegisterDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  UpdateProfileDto,
  CreateTenantWithOwnerDto,
  UserResponseDto,
  LoginResponseDto,
  TenantResponseDto,
} from './dto/identity.dto';
import {
  LoginCommand,
  RegisterCommand,
  ChangePasswordCommand,
  ForgotPasswordCommand,
  ResetPasswordCommand,
  UpdateProfileCommand,
  CreateTenantCommand,
} from '../application/commands/IdentityCommands';
import {
  GetUserProfileQuery,
  GetTenantQuery,
} from '../application/queries/IdentityQueries';

@Controller('auth')
export class IdentityController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('login')
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
  ): Promise<LoginResponseDto> {
    const result = await this.commandBus.execute(
      new LoginCommand(loginDto.email, loginDto.password),
    );

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: UserResponseDto.fromDomain(result.user),
      tenant: result.tenant
        ? TenantResponseDto.fromDomain(result.tenant)
        : undefined,
    };
  }

  @Post('register')
  async register(
    @Body(ValidationPipe) registerDto: RegisterDto,
  ): Promise<LoginResponseDto> {
    const result = await this.commandBus.execute(
      new RegisterCommand(
        registerDto.email,
        registerDto.password,
        registerDto.firstName,
        registerDto.lastName,
        registerDto.tenantName,
        registerDto.phone,
      ),
    );

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: UserResponseDto.fromDomain(result.user),
      tenant: TenantResponseDto.fromDomain(result.tenant),
    };
  }

  @Get('profile')
  @UseGuards(SupabaseAuthGuard)
  async getProfile(
    @Request() req: { user: { userId: string } },
  ): Promise<UserResponseDto> {
    const user = await this.queryBus.execute(
      new GetUserProfileQuery(req.user.userId),
    );

    return UserResponseDto.fromDomain(user);
  }

  @Put('profile')
  @UseGuards(SupabaseAuthGuard)
  async updateProfile(
    @Request() req: { user: { userId: string } },
    @Body(ValidationPipe) updateProfileDto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const user = await this.commandBus.execute(
      new UpdateProfileCommand(
        req.user.userId,
        updateProfileDto.firstName,
        updateProfileDto.lastName,
        updateProfileDto.phone,
        updateProfileDto.avatar,
        updateProfileDto.timezone,
        updateProfileDto.locale,
      ),
    );

    return UserResponseDto.fromDomain(user);
  }

  @Post('change-password')
  @UseGuards(SupabaseAuthGuard)
  async changePassword(
    @Request() req: { user: { userId: string; tenantId: string } },
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
  ): Promise<{ success: boolean }> {
    await this.commandBus.execute(
      new ChangePasswordCommand(
        req.user.userId,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword,
      ),
    );

    return { success: true };
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ success: boolean }> {
    await this.commandBus.execute(
      new ForgotPasswordCommand(forgotPasswordDto.email),
    );

    return { success: true };
  }

  @Post('reset-password')
  async resetPassword(
    @Body(ValidationPipe) resetPasswordDto: ResetPasswordDto,
  ): Promise<{ success: boolean }> {
    await this.commandBus.execute(
      new ResetPasswordCommand(
        resetPasswordDto.token,
        resetPasswordDto.newPassword,
      ),
    );

    return { success: true };
  }

  @Get('tenant')
  @UseGuards(SupabaseAuthGuard)
  async getTenant(
    @Request() req: { user: { tenantId: string } },
  ): Promise<TenantResponseDto> {
    const tenant = await this.queryBus.execute(
      new GetTenantQuery(req.user.tenantId),
    );

    return TenantResponseDto.fromDomain(tenant);
  }

  @Post('tenant')
  async createTenant(
    @Body(ValidationPipe) createTenantDto: CreateTenantWithOwnerDto,
  ): Promise<TenantResponseDto> {
    const tenant = await this.commandBus.execute(
      new CreateTenantCommand(
        createTenantDto.name,
        createTenantDto.slug,
        createTenantDto.planId || 'default-plan',
        createTenantDto.ownerEmail,
        createTenantDto.ownerPassword,
        createTenantDto.ownerFirstName,
        createTenantDto.ownerLastName,
      ),
    );

    return TenantResponseDto.fromDomain(tenant);
  }
}
