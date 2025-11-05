import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get<string>('database.url'),
        },
      },
      log:
        configService.get<string>('app.env') === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Helper method for soft delete
  async softDelete(model: string, where: Record<string, unknown>) {
    return await this[model].update({
      where,
      data: {
        deletedAt: new Date(),
      },
    });
  }

  // Helper method for tenant-scoped queries
  async findManyWithTenant(
    model: string,
    tenantId: string,
    args: Record<string, unknown> = {},
  ) {
    return await this[model].findMany({
      ...args,
      where: {
        ...(args.where as Record<string, unknown>),
        tenantId,
      },
    });
  }

  async findUniqueWithTenant(
    model: string,
    tenantId: string,
    where: Record<string, unknown>,
  ) {
    return await this[model].findUnique({
      where: {
        ...where,
        tenantId,
      },
    });
  }
}
