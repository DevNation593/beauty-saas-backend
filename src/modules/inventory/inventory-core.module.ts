import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '../../common/infra/database/database.module';
import { PrismaProductRepository } from './infra/repositories/PrismaProductRepository';
import { PRODUCT_REPOSITORY } from './domain/product.tokens';
import {
  CreateProductCommandHandler,
  UpdateProductCommandHandler,
  UpdateProductPriceCommandHandler,
  UpdateProductStockCommandHandler,
  AdjustProductStockCommandHandler,
  UpdateStockLimitsCommandHandler,
  ActivateProductCommandHandler,
  DeactivateProductCommandHandler,
  DiscontinueProductCommandHandler,
  DeleteProductCommandHandler,
} from './application/commands/ProductCommandHandlers';
import {
  GetProductByIdQueryHandler,
  GetProductsQueryHandler,
  GetLowStockProductsQueryHandler,
  GetOutOfStockProductsQueryHandler,
  GetCategoriesQueryHandler,
  GetBrandsQueryHandler,
  GetInventoryStatsQueryHandler,
  GetStockMovementsQueryHandler,
  GetMostSoldProductsQueryHandler,
} from './application/queries/ProductQueryHandlers';

const CommandHandlers = [
  CreateProductCommandHandler,
  UpdateProductCommandHandler,
  UpdateProductPriceCommandHandler,
  UpdateProductStockCommandHandler,
  AdjustProductStockCommandHandler,
  UpdateStockLimitsCommandHandler,
  ActivateProductCommandHandler,
  DeactivateProductCommandHandler,
  DiscontinueProductCommandHandler,
  DeleteProductCommandHandler,
];

const QueryHandlers = [
  GetProductByIdQueryHandler,
  GetProductsQueryHandler,
  GetLowStockProductsQueryHandler,
  GetOutOfStockProductsQueryHandler,
  GetCategoriesQueryHandler,
  GetBrandsQueryHandler,
  GetInventoryStatsQueryHandler,
  GetStockMovementsQueryHandler,
  GetMostSoldProductsQueryHandler,
];

@Module({
  imports: [CqrsModule, DatabaseModule],
  controllers: [],
  providers: [
    {
      provide: PRODUCT_REPOSITORY,
      useClass: PrismaProductRepository,
    },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [PRODUCT_REPOSITORY],
})
export class InventoryCoreModule {}
