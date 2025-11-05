import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Database
import { DatabaseModule } from '../../../common/infra/database/database.module';

// Controllers
import { IdentityController } from './identity.controller';

// Command Handlers
import {
  LoginHandler,
  RegisterHandler,
  ChangePasswordHandler,
  ForgotPasswordHandler,
  ResetPasswordHandler,
  UpdateProfileHandler,
  CreateTenantHandler,
} from '../application/handlers/IdentityCommandHandlers';

// Query Handlers
import {
  GetUserProfileHandler,
  GetUserByEmailHandler,
  GetUsersByTenantHandler,
  GetTenantHandler,
  GetTenantBySlugHandler,
  GetTenantsHandler,
} from '../application/handlers/IdentityQueryHandlers';

const commandHandlers = [
  LoginHandler,
  RegisterHandler,
  ChangePasswordHandler,
  ForgotPasswordHandler,
  ResetPasswordHandler,
  UpdateProfileHandler,
  CreateTenantHandler,
];

const queryHandlers = [
  GetUserProfileHandler,
  GetUserByEmailHandler,
  GetUsersByTenantHandler,
  GetTenantHandler,
  GetTenantBySlugHandler,
  GetTenantsHandler,
];

@Module({
  imports: [CqrsModule, DatabaseModule],
  controllers: [IdentityController],
  providers: [...commandHandlers, ...queryHandlers],
  exports: [],
})
export class IdentityTenancyModule {}
