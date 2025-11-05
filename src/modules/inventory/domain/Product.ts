import { BaseEntity } from '../../../common/domain/core/BaseEntity';
import { DomainEvent } from '../../../common/domain/core/DomainEvent';

export interface ProductCreatedEvent extends DomainEvent {
  type: 'ProductCreated';
  payload: {
    productId: string;
    tenantId: string;
    name: string;
    sku?: string;
    price: number;
  };
}

export interface StockUpdatedEvent extends DomainEvent {
  type: 'StockUpdated';
  payload: {
    productId: string;
    tenantId: string;
    previousStock: number;
    newStock: number;
    reason: string;
  };
}

export interface LowStockAlertEvent extends DomainEvent {
  type: 'LowStockAlert';
  payload: {
    productId: string;
    tenantId: string;
    currentStock: number;
    minStock: number;
  };
}

export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';

export interface ProductProps {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  price: number;
  cost?: number;
  category?: string;
  brand?: string;
  tenantId: string;
  stock: number;
  minStock: number;
  maxStock?: number;
  unit?: string;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class Product extends BaseEntity {
  private readonly props: ProductProps;

  constructor(props: ProductProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this.props = props;
    this.validate();
  }

  // Getters
  get productId(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get sku(): string | undefined {
    return this.props.sku;
  }

  get barcode(): string | undefined {
    return this.props.barcode;
  }

  get price(): number {
    return this.props.price;
  }

  get cost(): number | undefined {
    return this.props.cost;
  }

  get category(): string | undefined {
    return this.props.category;
  }

  get brand(): string | undefined {
    return this.props.brand;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get stock(): number {
    return this.props.stock;
  }

  get minStock(): number {
    return this.props.minStock;
  }

  get maxStock(): number | undefined {
    return this.props.maxStock;
  }

  get unit(): string | undefined {
    return this.props.unit;
  }

  get status(): ProductStatus {
    return this.props.status;
  }

  private validate(): void {
    if (!this.props.name?.trim()) {
      throw new Error('Product name is required');
    }
    if (!this.props.sku?.trim()) {
      throw new Error('Product SKU is required');
    }
    if (this.props.price < 0) {
      throw new Error('Product price cannot be negative');
    }
    if (this.props.cost !== undefined && this.props.cost < 0) {
      throw new Error('Product cost cannot be negative');
    }
    if (this.props.stock < 0) {
      throw new Error('Product stock cannot be negative');
    }
    if (this.props.minStock < 0) {
      throw new Error('Minimum stock cannot be negative');
    }
    if (
      this.props.maxStock !== undefined &&
      this.props.maxStock < this.props.minStock
    ) {
      throw new Error('Maximum stock cannot be less than minimum stock');
    }
  }

  // Business methods
  static create(data: {
    name: string;
    description?: string;
    sku?: string;
    barcode?: string;
    price: number;
    cost?: number;
    category?: string;
    brand?: string;
    tenantId: string;
    minStock?: number;
    maxStock?: number;
    unit?: string;
  }): Product {
    // Validations
    if (!data.name?.trim()) {
      throw new Error('Product name is required');
    }

    if (data.price < 0) {
      throw new Error('Product price cannot be negative');
    }

    if (data.cost !== undefined && data.cost < 0) {
      throw new Error('Product cost cannot be negative');
    }

    if (data.minStock !== undefined && data.minStock < 0) {
      throw new Error('Minimum stock cannot be negative');
    }

    if (data.maxStock !== undefined && data.maxStock < 0) {
      throw new Error('Maximum stock cannot be negative');
    }

    if (
      data.minStock !== undefined &&
      data.maxStock !== undefined &&
      data.minStock > data.maxStock
    ) {
      throw new Error('Minimum stock cannot be greater than maximum stock');
    }

    const product = new Product({
      id: crypto.randomUUID(),
      name: data.name.trim(),
      description: data.description?.trim(),
      sku: data.sku?.trim(),
      barcode: data.barcode?.trim(),
      price: data.price,
      cost: data.cost,
      category: data.category?.trim(),
      brand: data.brand?.trim(),
      tenantId: data.tenantId,
      stock: 0,
      minStock: data.minStock ?? 0,
      maxStock: data.maxStock,
      unit: data.unit?.trim(),
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Emit domain event
    product.addDomainEvent({
      type: 'ProductCreated',
      payload: {
        productId: product.id,
        tenantId: product.tenantId,
        name: product.name,
        sku: product.sku,
        price: product.price,
      },
      aggregateId: product.id,
      occurredAt: new Date(),
    });

    return product;
  }

  updateStock(newStock: number, reason: string): void {
    if (newStock < 0) {
      throw new Error('Stock cannot be negative');
    }

    const previousStock = this.props.stock;
    this.props.stock = newStock;
    this.props.updatedAt = new Date();

    // Emit stock updated event
    this.addDomainEvent({
      type: 'StockUpdated',
      payload: {
        productId: this.id,
        tenantId: this.tenantId,
        previousStock,
        newStock,
        reason,
      },
      aggregateId: this.id,
      occurredAt: new Date(),
    });

    // Check for low stock alert
    if (newStock <= this.minStock && newStock > 0) {
      this.addDomainEvent({
        type: 'LowStockAlert',
        payload: {
          productId: this.id,
          tenantId: this.tenantId,
          currentStock: newStock,
          minStock: this.minStock,
        },
        aggregateId: this.id,
        occurredAt: new Date(),
      });
    }
  }

  adjustStock(quantity: number, reason: string): void {
    const newStock = this.props.stock + quantity;
    this.updateStock(newStock, reason);
  }

  updatePrice(newPrice: number): void {
    if (newPrice < 0) {
      throw new Error('Price cannot be negative');
    }

    this.props.price = newPrice;
    this.props.updatedAt = new Date();
  }

  updateCost(newCost: number): void {
    if (newCost < 0) {
      throw new Error('Cost cannot be negative');
    }

    this.props.cost = newCost;
    this.props.updatedAt = new Date();
  }

  updateDetails(data: {
    name?: string;
    description?: string;
    category?: string;
    brand?: string;
    unit?: string;
  }): void {
    if (data.name !== undefined) {
      if (!data.name.trim()) {
        throw new Error('Product name cannot be empty');
      }
      this.props.name = data.name.trim();
    }

    if (data.description !== undefined) {
      this.props.description = data.description.trim() || undefined;
    }

    if (data.category !== undefined) {
      this.props.category = data.category.trim() || undefined;
    }

    if (data.brand !== undefined) {
      this.props.brand = data.brand.trim() || undefined;
    }

    if (data.unit !== undefined) {
      this.props.unit = data.unit.trim() || undefined;
    }

    this.props.updatedAt = new Date();
  }

  updateStockLimits(minStock: number, maxStock?: number): void {
    if (minStock < 0) {
      throw new Error('Minimum stock cannot be negative');
    }

    if (maxStock !== undefined && maxStock < 0) {
      throw new Error('Maximum stock cannot be negative');
    }

    if (maxStock !== undefined && minStock > maxStock) {
      throw new Error('Minimum stock cannot be greater than maximum stock');
    }

    this.props.minStock = minStock;
    this.props.maxStock = maxStock;
    this.props.updatedAt = new Date();

    // Check if current stock is now below minimum
    if (this.props.stock <= minStock && this.props.stock > 0) {
      this.addDomainEvent({
        type: 'LowStockAlert',
        payload: {
          productId: this.id,
          tenantId: this.tenantId,
          currentStock: this.props.stock,
          minStock: minStock,
        },
        aggregateId: this.id,
        occurredAt: new Date(),
      });
    }
  }

  deactivate(): void {
    this.props.status = 'INACTIVE';
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.status = 'ACTIVE';
    this.props.updatedAt = new Date();
  }

  discontinue(): void {
    this.props.status = 'DISCONTINUED';
    this.props.updatedAt = new Date();
  }

  // Computed properties
  get isActive(): boolean {
    return this.props.status === 'ACTIVE';
  }

  get isLowStock(): boolean {
    return this.props.stock <= this.props.minStock;
  }

  get isOutOfStock(): boolean {
    return this.props.stock === 0;
  }

  get profitMargin(): number | undefined {
    if (this.props.cost === undefined || this.props.cost === 0) {
      return undefined;
    }
    return ((this.props.price - this.props.cost) / this.props.cost) * 100;
  }

  get stockStatus(): 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK' | 'OVERSTOCKED' {
    if (this.props.stock === 0) {
      return 'OUT_OF_STOCK';
    }
    if (this.props.stock <= this.props.minStock) {
      return 'LOW_STOCK';
    }
    if (this.props.maxStock && this.props.stock > this.props.maxStock) {
      return 'OVERSTOCKED';
    }
    return 'IN_STOCK';
  }

  // Business rules validation
  canBeSold(quantity: number = 1): boolean {
    return this.props.status === 'ACTIVE' && this.props.stock >= quantity;
  }

  validateSKU(sku: string): boolean {
    if (!sku.trim()) {
      return false;
    }
    // SKU should be alphanumeric and can contain hyphens/underscores
    const skuRegex = /^[a-zA-Z0-9_-]+$/;
    return skuRegex.test(sku);
  }

  validateBarcode(barcode: string): boolean {
    if (!barcode.trim()) {
      return false;
    }
    // Basic barcode validation (can be enhanced for specific formats)
    const barcodeRegex = /^[0-9]{8,14}$/;
    return barcodeRegex.test(barcode);
  }
}
