import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';

// Webhook controllers for different integrations
import { PaymentWebhookController } from './controllers/payment-webhook.controller';

// Webhook handlers
import { StripeWebhookHandler } from './handlers/stripe-webhook.handler';

// Integration modules
import { AdminModule } from '../../modules/admin/interface/admin.module';
import { AgendaModule } from '../../modules/agenda/interface/agenda.module';
import { CrmModule } from '../../modules/crm/crm.module';

@Module({
  imports: [ConfigModule, CqrsModule, AdminModule, AgendaModule, CrmModule],
  controllers: [PaymentWebhookController],
  providers: [StripeWebhookHandler],
  exports: [StripeWebhookHandler],
})
export class WebhooksApiModule {}
