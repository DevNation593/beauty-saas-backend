import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '../../common/infra/database/database.module';
import { PrismaSaleRepository } from './infra/repositories/PrismaSaleRepository';
// Handlers are registered in `pos-core.module.ts`

@Module({
  imports: [CqrsModule, DatabaseModule],
  controllers: [],
  providers: [
    {
      provide: 'SALE_REPOSITORY',
      useClass: PrismaSaleRepository,
    },
  ],
  exports: ['SALE_REPOSITORY'],
})
export class PosModule {}
