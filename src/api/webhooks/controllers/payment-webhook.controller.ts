import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StripeWebhookHandler } from '../handlers/stripe-webhook.handler';

@ApiTags('Webhooks - Payments')
@Controller('webhooks/payments')
export class PaymentWebhookController {
  private readonly logger = new Logger(PaymentWebhookController.name);

  constructor(private readonly stripeWebhookHandler: StripeWebhookHandler) {}

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  handleStripeWebhook(
    @Body() body: unknown,
    @Headers('stripe-signature') signature: string,
  ): { received: boolean } {
    this.logger.log('Received Stripe webhook');

    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }

    const payload = JSON.stringify(body);

    // Verify webhook signature
    const isValidSignature = this.stripeWebhookHandler.verifySignature(
      payload,
      signature,
    );

    if (!isValidSignature) {
      throw new BadRequestException('Invalid webhook signature');
    }

    try {
      // handler accepts unknown and will validate internally
      this.stripeWebhookHandler.handleEvent(body);
      return { received: true };
    } catch (error) {
      this.logger.error('Error processing Stripe webhook:', error);
      throw error;
    }
  }

  @Post('mercadopago')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle MercadoPago webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  handleMercadoPagoWebhook(
    @Body() _body: unknown,
    @Headers('x-signature') _signature?: string,
  ): { received: boolean } {
    this.logger.log('Received MercadoPago webhook');

    // TODO: Implement MercadoPago webhook verification and handling
    // const mercadoPagoHandler = new MercadoPagoWebhookHandler();
    // await mercadoPagoHandler.handleEvent(body);

    return { received: true };
  }
}
