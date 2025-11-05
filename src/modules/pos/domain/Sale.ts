import { BaseEntity } from '../../../common/domain/core/BaseEntity';
import { DomainEvent } from '../../../common/domain/core/DomainEvent';

export enum SaleStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
  CHECK = 'CHECK',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
  STORE_CREDIT = 'STORE_CREDIT',
}

export enum SaleType {
  SERVICE = 'SERVICE',
  PRODUCT = 'PRODUCT',
  PACKAGE = 'PACKAGE',
  MIXED = 'MIXED',
}

export interface SaleItemProps {
  id: string;
  itemId: string; // Used for Prisma mapping
  type: 'SERVICE' | 'PRODUCT';
  referenceId: string; // serviceId or productId
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  staffId?: string; // For services
  notes?: string;
}

export interface SaleProps {
  id: string;
  tenantId: string;
  clientId?: string;
  staffId: string;
  appointmentId?: string;
  items: SaleItemProps[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  tipAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  type: SaleType;
  notes?: string;
  paymentReference?: string;
  paymentDetails?: Record<string, unknown>;
  paidAt?: Date;
  saleDate: Date;
  refundedAmount?: number;
  refundReason?: string;
  cashierId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SaleCreatedEvent implements DomainEvent {
  readonly type = 'SALE_CREATED';
  readonly payload: {
    saleId: string;
    tenantId: string;
    totalAmount: number;
    clientId?: string;
  };
  readonly aggregateId: string;
  readonly occurredAt: Date;

  constructor(
    saleId: string,
    tenantId: string,
    totalAmount: number,
    clientId?: string,
  ) {
    this.aggregateId = saleId;
    this.occurredAt = new Date();
    this.payload = {
      saleId,
      tenantId,
      totalAmount,
      clientId,
    };
  }
}

export class SaleCompletedEvent implements DomainEvent {
  readonly type = 'SALE_COMPLETED';
  readonly payload: {
    saleId: string;
    tenantId: string;
    totalAmount: number;
    paymentMethod: PaymentMethod;
  };
  readonly aggregateId: string;
  readonly occurredAt: Date;

  constructor(
    saleId: string,
    tenantId: string,
    totalAmount: number,
    paymentMethod: PaymentMethod,
  ) {
    this.aggregateId = saleId;
    this.occurredAt = new Date();
    this.payload = {
      saleId,
      tenantId,
      totalAmount,
      paymentMethod,
    };
  }
}

export class SaleRefundedEvent implements DomainEvent {
  readonly type = 'SALE_REFUNDED';
  readonly payload: {
    saleId: string;
    tenantId: string;
    refundAmount: number;
    reason?: string;
  };
  readonly aggregateId: string;
  readonly occurredAt: Date;

  constructor(
    saleId: string,
    tenantId: string,
    refundAmount: number,
    reason?: string,
  ) {
    this.aggregateId = saleId;
    this.occurredAt = new Date();
    this.payload = {
      saleId,
      tenantId,
      refundAmount,
      reason,
    };
  }
}

export class SalePaymentProcessedEvent implements DomainEvent {
  readonly type = 'SALE_PAYMENT_PROCESSED';
  readonly payload: {
    saleId: string;
    tenantId: string;
    paymentMethod: PaymentMethod;
    totalAmount: number;
  };
  readonly aggregateId: string;
  readonly occurredAt: Date;

  constructor(
    saleId: string,
    tenantId: string,
    paymentMethod: PaymentMethod,
    totalAmount: number,
  ) {
    this.aggregateId = saleId;
    this.occurredAt = new Date();
    this.payload = {
      saleId,
      tenantId,
      paymentMethod,
      totalAmount,
    };
  }
}

export class SalePartialRefundedEvent implements DomainEvent {
  readonly type = 'SALE_PARTIAL_REFUNDED';
  readonly payload: {
    saleId: string;
    tenantId: string;
    refundAmount: number;
    reason?: string;
  };
  readonly aggregateId: string;
  readonly occurredAt: Date;

  constructor(
    saleId: string,
    tenantId: string,
    refundAmount: number,
    reason?: string,
  ) {
    this.aggregateId = saleId;
    this.occurredAt = new Date();
    this.payload = {
      saleId,
      tenantId,
      refundAmount,
      reason,
    };
  }
}

export class SaleTotalsUpdatedEvent implements DomainEvent {
  readonly type = 'SALE_TOTALS_UPDATED';
  readonly payload: {
    saleId: string;
    tenantId: string;
    updates: Record<string, unknown>;
  };
  readonly aggregateId: string;
  readonly occurredAt: Date;

  constructor(
    saleId: string,
    tenantId: string,
    updates: Record<string, unknown>,
  ) {
    this.aggregateId = saleId;
    this.occurredAt = new Date();
    this.payload = {
      saleId,
      tenantId,
      updates,
    };
  }
}

export class Sale extends BaseEntity {
  private props: SaleProps;

  constructor(props: SaleProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this.props = props;
  }

  // Getters for repository access
  get tenantId(): string {
    return this.props.tenantId;
  }

  get clientId(): string | undefined {
    return this.props.clientId;
  }

  get staffId(): string {
    return this.props.staffId;
  }

  get status(): SaleStatus {
    return this.props.status;
  }

  get subtotal(): number {
    return this.props.subtotal;
  }

  get discount(): number {
    return this.props.discountAmount;
  }

  get tax(): number {
    return this.props.taxAmount;
  }

  get tip(): number {
    return this.props.tipAmount;
  }

  get total(): number {
    return this.props.totalAmount;
  }

  get paymentMethod(): PaymentMethod {
    return this.props.paymentMethod;
  }

  get paymentDetails(): string | undefined {
    return this.props.paymentReference;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get saleDate(): Date {
    return this.props.saleDate;
  }

  get items(): SaleItemProps[] {
    return this.props.items;
  }

  public static create(
    tenantId: string,
    staffId: string,
    cashierId: string,
    items: Omit<SaleItemProps, 'id'>[],
    clientId?: string,
    appointmentId?: string,
  ): Sale {
    // Generate IDs for items
    const saleItems: SaleItemProps[] = items.map((item) => ({
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }));

    // Calculate totals
    const subtotal = saleItems.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = saleItems.reduce(
      (sum, item) => sum + item.discount,
      0,
    );
    const taxAmount = saleItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const totalAmount = subtotal - discountAmount + taxAmount;

    // Determine sale type
    const hasServices = saleItems.some((item) => item.type === 'SERVICE');
    const hasProducts = saleItems.some((item) => item.type === 'PRODUCT');
    let type: SaleType;
    if (hasServices && hasProducts) {
      type = SaleType.MIXED;
    } else if (hasServices) {
      type = SaleType.SERVICE;
    } else {
      type = SaleType.PRODUCT;
    }

    const saleId = `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const sale = new Sale({
      id: saleId,
      tenantId,
      clientId,
      staffId,
      appointmentId,
      items: saleItems,
      subtotal,
      discountAmount,
      taxAmount,
      tipAmount: 0,
      totalAmount,
      paymentMethod: PaymentMethod.CASH, // Default, will be set when completing
      status: SaleStatus.PENDING,
      type,
      saleDate: now,
      cashierId,
      createdAt: now,
      updatedAt: now,
    });

    sale.addDomainEvent({
      type: 'SaleCreated',
      payload: {
        saleId: sale.id,
        tenantId,
        totalAmount,
        clientId,
      },
      aggregateId: sale.id,
      occurredAt: new Date(),
    });

    return sale;
  }

  get isCompleted(): boolean {
    return this.props.status === SaleStatus.COMPLETED;
  }

  get canBeRefunded(): boolean {
    return (
      this.props.status === SaleStatus.COMPLETED &&
      (this.props.refundedAmount || 0) < this.props.totalAmount
    );
  }

  get remainingRefundableAmount(): number {
    return this.props.totalAmount - (this.props.refundedAmount || 0);
  }

  public addItem(item: Omit<SaleItemProps, 'id'>): void {
    if (this.props.status !== SaleStatus.PENDING) {
      throw new Error('Cannot add items to a non-pending sale');
    }

    const newItem: SaleItemProps = {
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.props.items.push(newItem);
    this.recalculateTotals();
  }

  public removeItem(itemId: string): void {
    if (this.props.status !== SaleStatus.PENDING) {
      throw new Error('Cannot remove items from a non-pending sale');
    }

    const itemIndex = this.props.items.findIndex((item) => item.id === itemId);
    if (itemIndex > -1) {
      this.props.items.splice(itemIndex, 1);
      this.recalculateTotals();
    }
  }

  public updateItemQuantity(itemId: string, quantity: number): void {
    if (this.props.status !== SaleStatus.PENDING) {
      throw new Error('Cannot update items in a non-pending sale');
    }

    const item = this.props.items.find((item) => item.id === itemId);
    if (item) {
      item.quantity = quantity;
      item.subtotal = item.unitPrice * quantity;
      item.taxAmount = item.subtotal * item.taxRate;
      item.total = item.subtotal - item.discount + item.taxAmount;
      this.recalculateTotals();
    }
  }

  public applyDiscount(itemId: string, discount: number): void {
    if (this.props.status !== SaleStatus.PENDING) {
      throw new Error('Cannot apply discount to a non-pending sale');
    }

    const item = this.props.items.find((item) => item.id === itemId);
    if (item) {
      item.discount = discount;
      item.total = item.subtotal - item.discount + item.taxAmount;
      this.recalculateTotals();
    }
  }

  public addTip(amount: number): void {
    if (this.props.status !== SaleStatus.PENDING) {
      throw new Error('Cannot add tip to a non-pending sale');
    }

    this.props.tipAmount = amount;
    this.props.totalAmount =
      this.props.subtotal -
      this.props.discountAmount +
      this.props.taxAmount +
      this.props.tipAmount;
  }

  public complete(
    paymentMethod: PaymentMethod,
    paymentReference?: string,
  ): void {
    if (this.props.status !== SaleStatus.PENDING) {
      throw new Error('Sale is not in pending status');
    }

    if (this.props.items.length === 0) {
      throw new Error('Cannot complete sale with no items');
    }

    this.props.status = SaleStatus.COMPLETED;
    this.props.paymentMethod = paymentMethod;
    this.props.paymentReference = paymentReference;
    this.props.updatedAt = new Date();

    this.addDomainEvent({
      type: 'SaleCompleted',
      payload: {
        saleId: this.id,
        tenantId: this.props.tenantId,
        totalAmount: this.props.totalAmount,
        paymentMethod,
      },
      aggregateId: this.id,
      occurredAt: new Date(),
    });
  }

  public cancel(reason?: string): void {
    if (this.props.status !== SaleStatus.PENDING) {
      throw new Error('Only pending sales can be cancelled');
    }

    this.props.status = SaleStatus.CANCELLED;
    this.props.notes = reason
      ? `${this.props.notes || ''}\nCancelled: ${reason}`
      : this.props.notes;
    this.props.updatedAt = new Date();
  }

  public refund(amount: number, reason?: string): void {
    if (!this.canBeRefunded) {
      throw new Error('Sale cannot be refunded');
    }

    if (amount > this.remainingRefundableAmount) {
      throw new Error('Refund amount exceeds remaining refundable amount');
    }

    this.props.refundedAmount = (this.props.refundedAmount || 0) + amount;
    this.props.refundReason = reason;

    if (this.props.refundedAmount >= this.props.totalAmount) {
      this.props.status = SaleStatus.REFUNDED;
    } else {
      this.props.status = SaleStatus.PARTIALLY_REFUNDED;
    }

    this.props.updatedAt = new Date();

    this.addDomainEvent({
      type: 'SaleRefunded',
      payload: {
        saleId: this.id,
        tenantId: this.props.tenantId,
        refundAmount: amount,
        reason,
      },
      aggregateId: this.id,
      occurredAt: new Date(),
    });
  }

  private recalculateTotals(): void {
    this.props.subtotal = this.props.items.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );
    this.props.discountAmount = this.props.items.reduce(
      (sum, item) => sum + item.discount,
      0,
    );
    this.props.taxAmount = this.props.items.reduce(
      (sum, item) => sum + item.taxAmount,
      0,
    );
    this.props.totalAmount =
      this.props.subtotal -
      this.props.discountAmount +
      this.props.taxAmount +
      this.props.tipAmount;

    // Update sale type
    const hasServices = this.props.items.some(
      (item) => item.type === 'SERVICE',
    );
    const hasProducts = this.props.items.some(
      (item) => item.type === 'PRODUCT',
    );
    if (hasServices && hasProducts) {
      this.props.type = SaleType.MIXED;
    } else if (hasServices) {
      this.props.type = SaleType.SERVICE;
    } else {
      this.props.type = SaleType.PRODUCT;
    }
  }

  // Computed properties
  get serviceItems(): SaleItemProps[] {
    return this.props.items.filter((item) => item.type === 'SERVICE');
  }

  get productItems(): SaleItemProps[] {
    return this.props.items.filter((item) => item.type === 'PRODUCT');
  }

  get effectiveTotal(): number {
    return this.props.totalAmount - (this.props.refundedAmount || 0);
  }

  get profitMargin(): number {
    // This would need to be calculated based on cost of goods/services
    // For now, return a placeholder
    return 0;
  }

  public processPayment(
    paymentMethod: PaymentMethod,
    paymentDetails?: Record<string, unknown>,
  ): void {
    if (this.props.status !== SaleStatus.PENDING) {
      throw new Error('Can only process payment for pending sales');
    }

    this.props.paymentMethod = paymentMethod;
    this.props.paymentDetails = paymentDetails;
    this.props.status = SaleStatus.COMPLETED;
    this.props.paidAt = new Date();

    this.addDomainEvent(
      new SalePaymentProcessedEvent(
        this.id,
        this.props.tenantId,
        paymentMethod,
        this.props.totalAmount,
      ),
    );
  }

  public processRefund(reason?: string): void {
    if (this.props.status !== SaleStatus.COMPLETED) {
      throw new Error('Can only refund completed sales');
    }

    this.props.status = SaleStatus.REFUNDED;
    this.props.refundedAmount = this.props.totalAmount;
    this.props.refundReason = reason;

    this.addDomainEvent(
      new SaleRefundedEvent(
        this.id,
        this.props.tenantId,
        this.props.totalAmount,
        reason,
      ),
    );
  }

  public processPartialRefund(amount: number, reason?: string): void {
    if (this.props.status !== SaleStatus.COMPLETED) {
      throw new Error('Can only refund completed sales');
    }

    if (amount >= this.props.totalAmount) {
      this.processRefund(reason);
      return;
    }

    this.props.status = SaleStatus.PARTIALLY_REFUNDED;
    this.props.refundedAmount = (this.props.refundedAmount || 0) + amount;
    this.props.refundReason = reason;

    this.addDomainEvent(
      new SalePartialRefundedEvent(
        this.id,
        this.props.tenantId,
        amount,
        reason,
      ),
    );
  }

  public updateTotals(updates: {
    subtotal?: number;
    discountAmount?: number;
    taxAmount?: number;
    tipAmount?: number;
  }): void {
    if (updates.subtotal !== undefined) this.props.subtotal = updates.subtotal;
    if (updates.discountAmount !== undefined)
      this.props.discountAmount = updates.discountAmount;
    if (updates.taxAmount !== undefined)
      this.props.taxAmount = updates.taxAmount;
    if (updates.tipAmount !== undefined)
      this.props.tipAmount = updates.tipAmount;

    this.recalculateTotals();

    this.addDomainEvent(
      new SaleTotalsUpdatedEvent(this.id, this.props.tenantId, updates),
    );
  }

  public updateNotes(notes: string): void {
    this.props.notes = notes;
  }

  getProps(): SaleProps {
    return { ...this.props };
  }
}
