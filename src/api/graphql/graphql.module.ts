import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { CqrsModule } from '@nestjs/cqrs';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Resolvers
import { AdminResolver } from './resolvers/admin.resolver';

// Services and modules
import { AdminModule } from '../../modules/admin/interface/admin.module';

// Guards and middleware
import { GraphQLAuthGuard } from './guards/graphql-auth.guard';
import { GraphQLTenantGuard } from './guards/graphql-tenant.guard';
import { GraphQLRoleGuard } from './guards/graphql-role.guard';

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        autoSchemaFile: join(process.cwd(), 'src/api/graphql/schema.gql'),
        sortSchema: true,
        playground: configService.get('app.env') !== 'production',
        introspection: configService.get('app.env') !== 'production',
        context: ({ req, res }: any) => ({ req, res }),
        formatError: (error: any) => ({
          message: error.message,
          code: error.extensions?.code,
          timestamp: new Date().toISOString(),
        }),
      }),
    }),
    CqrsModule,
    AdminModule,
  ],
  providers: [
    AdminResolver,
    GraphQLAuthGuard,
    GraphQLTenantGuard,
    GraphQLRoleGuard,
  ],
  exports: [GraphQLModule],
})
export class ApiGraphQLModule {}
