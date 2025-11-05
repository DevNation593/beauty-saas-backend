import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SupabaseService } from '../../../common/infra/supabase/supabase.service';

class SignInDto {
  email!: string;
  password!: string;
}

class SignUpDto {
  email!: string;
  password!: string;
  metadata?: Record<string, unknown>;
}

@ApiTags('Authentication')
@Controller('auth')
export class SupabaseAuthController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiResponse({ status: 200, description: 'Successfully signed in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async signIn(@Body() signInDto: SignInDto) {
    try {
      const { session, user } = await this.supabaseService.signIn(
        signInDto.email,
        signInDto.password,
      );

      return {
        access_token: session?.access_token,
        refresh_token: session?.refresh_token,
        user: {
          id: user.id,
          email: user.email,
          metadata: user.user_metadata,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Sign up with email and password' })
  @ApiResponse({ status: 201, description: 'Successfully signed up' })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or user already exists',
  })
  async signUp(@Body() signUpDto: SignUpDto) {
    try {
      const { session, user } = await this.supabaseService.signUp(
        signUpDto.email,
        signUpDto.password,
        signUpDto.metadata,
      );

      return {
        access_token: session?.access_token,
        refresh_token: session?.refresh_token,
        user: {
          id: user?.id,
          email: user?.email,
          metadata: user?.user_metadata,
        },
        message: 'Please check your email to confirm your account',
      };
    } catch (error) {
      throw new UnauthorizedException(
        'Sign up failed. User may already exist.',
      );
    }
  }

  @Post('signout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign out current user' })
  @ApiResponse({ status: 200, description: 'Successfully signed out' })
  async signOut() {
    await this.supabaseService.signOut();
    return { message: 'Successfully signed out' };
  }
}
