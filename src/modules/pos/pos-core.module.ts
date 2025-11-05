import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '../../common/infra/database/database.module';
import { PrismaSaleRepository } from './infra/repositories/PrismaSaleRepository';
import {
  CreateSaleCommandHandler,
  UpdateSaleCommandHandler,
  ProcessPaymentCommandHandler,
  RefundSaleCommandHandler,
  CancelSaleCommandHandler,
} from './application/commands/SaleCommandHandlers';
import {
  GetSaleByIdQueryHandler,
  GetSalesQueryHandler,
  GetDailySalesQueryHandler,
  GetSalesReportQueryHandler,
  GetTopServicesQueryHandler,
  GetTopProductsQueryHandler,
  GetStaffPerformanceQueryHandler,
} from './application/queries/SaleQueryHandlers';

const CommandHandlers = [
  CreateSaleCommandHandler,
  UpdateSaleCommandHandler,
  ProcessPaymentCommandHandler,
  RefundSaleCommandHandler,
  CancelSaleCommandHandler,
];

const QueryHandlers = [
  GetSaleByIdQueryHandler,
  GetSalesQueryHandler,
  GetDailySalesQueryHandler,
  GetSalesReportQueryHandler,
  GetTopServicesQueryHandler,
  GetTopProductsQueryHandler,
  GetStaffPerformanceQueryHandler,
];

@Module({
  imports: [CqrsModule, DatabaseModule],
  controllers: [],
  providers: [
    {
      provide: 'SALE_REPOSITORY',
      useClass: PrismaSaleRepository,
    },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: ['SALE_REPOSITORY'],
})
export class PosCoreModule {}
