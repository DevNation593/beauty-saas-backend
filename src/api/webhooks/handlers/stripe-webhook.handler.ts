import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandBus } from '@nestjs/cqrs';
import * as crypto from 'crypto';
import { asRecord, getIdFromUnknown } from '../../../common/utils/safe';

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: unknown;
  };
  created: number;
  livemode: boolean;
}

@Injectable()
export class StripeWebhookHandler {
  private readonly logger = new Logger(StripeWebhookHandler.name);
  private readonly stripeWebhookSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly commandBus: CommandBus,
  ) {
    this.stripeWebhookSecret =
      this.configService.get('stripe.webhookSecret') || '';
  }

  /**
   * Verify Stripe webhook signature
   */
  verifySignature(payload: string, signature: string): boolean {
    try {
      const elements = signature.split(',');
      const timestamp = elements
        .find((element) => element.startsWith('t='))
        ?.split('=')[1];
      const v1Signature = elements
        .find((element) => element.startsWith('v1='))
        ?.split('=')[1];

      if (!timestamp || !v1Signature) {
        throw new BadRequestException('Invalid signature format');
      }

      const expectedSignature = crypto
        .createHmac('sha256', this.stripeWebhookSecret)
        .update(`${timestamp}.${payload}`)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(v1Signature, 'hex'),
        Buffer.from(expectedSignature, 'hex'),
      );
    } catch (error) {
      this.logger.error('Stripe signature verification failed', error);
      return false;
    }
  }

  /**
   * Handle different Stripe webhook events
   */
  handleEvent(event: unknown): void {
    const e = asRecord(event);
    const type = typeof e.type === 'string' ? e.type : 'unknown';
    this.logger.log(`Processing Stripe webhook event: ${type}`);

    try {
      switch (type) {
        case 'payment_intent.succeeded':
          this.handlePaymentSucceeded(e);
          break;
        case 'payment_intent.payment_failed':
          this.handlePaymentFailed(e);
          break;
        case 'customer.subscription.created':
          this.handleSubscriptionCreated(e);
          break;
        case 'customer.subscription.updated':
          this.handleSubscriptionUpdated(e);
          break;
        case 'customer.subscription.deleted':
          this.handleSubscriptionCancelled(e);
          break;
        case 'invoice.payment_succeeded':
          this.handleInvoicePaymentSucceeded(e);
          break;
        case 'invoice.payment_failed':
          this.handleInvoicePaymentFailed(e);
          break;
        default:
          this.logger.warn(`Unhandled Stripe webhook event type: ${type}`);
      }
    } catch (error) {
      this.logger.error(`Error handling Stripe webhook event ${type}:`, error);
    }
  }
  private handlePaymentSucceeded(event: Record<string, unknown>): void {
    const data = asRecord(event).data ?? {};
    const obj = asRecord(data).object ?? {};
    const paymentId = getIdFromUnknown(obj);
    if (paymentId) {
      this.logger.log(`Payment succeeded: ${paymentId}`);
    }
  }

  private handlePaymentFailed(event: Record<string, unknown>): void {
    const data = asRecord(event).data ?? {};
    const obj = asRecord(data).object ?? {};
    const paymentId = getIdFromUnknown(obj);
    if (paymentId) {
      this.logger.log(`Payment failed: ${paymentId}`);
    }
  }

  private handleSubscriptionCreated(event: Record<string, unknown>): void {
    const data = asRecord(event).data ?? {};
    const obj = asRecord(data).object ?? {};
    const subscriptionId = getIdFromUnknown(obj);
    if (subscriptionId) {
      this.logger.log(`Subscription created: ${subscriptionId}`);
    }
  }

  private handleSubscriptionUpdated(event: Record<string, unknown>): void {
    const data = asRecord(event).data ?? {};
    const obj = asRecord(data).object ?? {};
    const subscriptionId = getIdFromUnknown(obj);
    if (subscriptionId) {
      this.logger.log(`Subscription updated: ${subscriptionId}`);
    }
  }

  private handleSubscriptionCancelled(event: Record<string, unknown>): void {
    const data = asRecord(event).data ?? {};
    const obj = asRecord(data).object ?? {};
    const subscriptionId = getIdFromUnknown(obj);
    if (subscriptionId) {
      this.logger.log(`Subscription cancelled: ${subscriptionId}`);
    }
  }

  private handleInvoicePaymentSucceeded(event: Record<string, unknown>): void {
    const data = asRecord(event).data ?? {};
    const obj = asRecord(data).object ?? {};
    const invoiceId = getIdFromUnknown(obj);
    if (invoiceId) {
      this.logger.log(`Invoice payment succeeded: ${invoiceId}`);
    }
  }

  private handleInvoicePaymentFailed(event: Record<string, unknown>): void {
    const data = asRecord(event).data ?? {};
    const obj = asRecord(data).object ?? {};
    const invoiceId = getIdFromUnknown(obj);
    if (invoiceId) {
      this.logger.log(`Invoice payment failed: ${invoiceId}`);
    }
  }
}
