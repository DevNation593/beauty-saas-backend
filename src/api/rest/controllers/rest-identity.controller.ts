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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../../../common/auth/supabase/supabase-auth.guard';
import { RestController } from '../decorators/api-version.decorator';
import { ApiResponseDto } from '../dto/common.dto';

// Import existing DTOs and commands from identity module
import {
  LoginDto,
  RegisterDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  UpdateProfileDto,
  UserResponseDto,
  LoginResponseDto,
} from '../../../modules/identity-tenancy/interface/dto/identity.dto';

import {
  LoginCommand,
  RegisterCommand,
  ChangePasswordCommand,
  ForgotPasswordCommand,
  ResetPasswordCommand,
  UpdateProfileCommand,
} from '../../../modules/identity-tenancy/application/commands/IdentityCommands';

import { GetUserProfileQuery } from '../../../modules/identity-tenancy/application/queries/IdentityQueries';

@RestController('Identity & Authentication')
@Controller('v1/auth')
export class RestIdentityController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: ApiResponseDto<LoginResponseDto>,
  })
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
  ): Promise<ApiResponseDto<LoginResponseDto>> {
    const result = await this.commandBus.execute(
      new LoginCommand(loginDto.email, loginDto.password),
    );

    const response: LoginResponseDto = {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: UserResponseDto.fromDomain(result.user),
      tenant: result.tenant ? result.tenant : undefined,
    };

    return new ApiResponseDto(response, 'Login successful');
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({
    status: 201,
    description: 'Registration successful',
    type: ApiResponseDto<LoginResponseDto>,
  })
  async register(
    @Body(ValidationPipe) registerDto: RegisterDto,
  ): Promise<ApiResponseDto<LoginResponseDto>> {
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

    const response: LoginResponseDto = {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: UserResponseDto.fromDomain(result.user),
      tenant: result.tenant,
    };

    return new ApiResponseDto(response, 'Registration successful');
  }

  @Get('profile')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    type: ApiResponseDto<UserResponseDto>,
  })
  async getProfile(
    @Request() req: { user: { userId: string } },
  ): Promise<ApiResponseDto<UserResponseDto>> {
    const user = await this.queryBus.execute(
      new GetUserProfileQuery(req.user.userId),
    );

    const response = UserResponseDto.fromDomain(user);
    return new ApiResponseDto(response, 'Profile retrieved successfully');
  }

  @Put('profile')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: ApiResponseDto<UserResponseDto>,
  })
  async updateProfile(
    @Request() req: { user: { userId: string } },
    @Body(ValidationPipe) updateProfileDto: UpdateProfileDto,
  ): Promise<ApiResponseDto<UserResponseDto>> {
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

    const response = UserResponseDto.fromDomain(user);
    return new ApiResponseDto(response, 'Profile updated successfully');
  }

  @Post('change-password')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    type: ApiResponseDto<boolean>,
  })
  async changePassword(
    @Request() req: { user: { userId: string } },
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
  ): Promise<ApiResponseDto<boolean>> {
    await this.commandBus.execute(
      new ChangePasswordCommand(
        req.user.userId,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword,
      ),
    );

    return new ApiResponseDto(true, 'Password changed successfully');
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent',
    type: ApiResponseDto<boolean>,
  })
  async forgotPassword(
    @Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ApiResponseDto<boolean>> {
    await this.commandBus.execute(
      new ForgotPasswordCommand(forgotPasswordDto.email),
    );

    return new ApiResponseDto(true, 'Password reset email sent');
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    type: ApiResponseDto<boolean>,
  })
  async resetPassword(
    @Body(ValidationPipe) resetPasswordDto: ResetPasswordDto,
  ): Promise<ApiResponseDto<boolean>> {
    await this.commandBus.execute(
      new ResetPasswordCommand(
        resetPasswordDto.token,
        resetPasswordDto.newPassword,
      ),
    );

    return new ApiResponseDto(true, 'Password reset successfully');
  }
}
