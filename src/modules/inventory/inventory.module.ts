import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '../../common/infra/database/database.module';
import { PrismaProductRepository } from './infra/repositories/PrismaProductRepository';
import { PRODUCT_REPOSITORY } from './domain/product.tokens';
// Handlers are registered in `inventory-core.module.ts`

@Module({
  imports: [CqrsModule, DatabaseModule],
  controllers: [],
  providers: [
    {
      provide: PRODUCT_REPOSITORY,
      useClass: PrismaProductRepository,
    },
  ],
  exports: [PRODUCT_REPOSITORY],
})
export class InventoryModule {}
