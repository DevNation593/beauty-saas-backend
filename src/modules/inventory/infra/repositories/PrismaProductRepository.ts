import { Injectable } from '@nestjs/common';
import { Prisma, ProductStatus as PrismaProductStatus } from '@prisma/client';
import { PrismaService } from '../../../../common/infra/database/prisma.service';
import {
  ProductRepository,
  ProductFilters,
  ProductSortOptions,
} from '../../domain/ProductRepository';
import { Product } from '../../domain/Product';

@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(product: Product): Promise<void> {
    const data = this.toPrismaData(product);

    await this.prisma.product.upsert({
      where: { id: product.id },
      create: data,
      update: data,
    });
  }

  async findById(id: string, tenantId: string): Promise<Product | null> {
    const productData = await this.prisma.product.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    return productData ? this.toDomain(productData) : null;
  }

  async findBySku(sku: string, tenantId: string): Promise<Product | null> {
    const productData = await this.prisma.product.findFirst({
      where: {
        sku,
        tenantId,
      },
    });

    return productData ? this.toDomain(productData) : null;
  }

  async findByBarcode(
    barcode: string,
    tenantId: string,
  ): Promise<Product | null> {
    const productData = await this.prisma.product.findFirst({
      where: {
        barcode,
        tenantId,
      },
    });

    return productData ? this.toDomain(productData) : null;
  }

  async existsBySku(sku: string, tenantId: string): Promise<boolean> {
    const count = await this.prisma.product.count({
      where: { sku, tenantId },
    });
    return count > 0;
  }

  async existsByBarcode(barcode: string, tenantId: string): Promise<boolean> {
    const count = await this.prisma.product.count({
      where: { barcode, tenantId },
    });
    return count > 0;
  }

  async findByTenant(
    tenantId: string,
    filters?: ProductFilters,
    options?: { page: number; limit: number },
  ): Promise<Product[]> {
    const result = await this.findAll(tenantId, filters, undefined, options);
    return result.products;
  }

  async countByTenant(
    tenantId: string,
    filters?: ProductFilters,
  ): Promise<number> {
    const result = await this.findAll(tenantId, filters);
    return result.total;
  }

  async getLowStockProducts(tenantId: string): Promise<Product[]> {
    const result = await this.findAll(tenantId, { stockStatus: 'LOW_STOCK' });
    return result.products;
  }

  async getOutOfStockProducts(tenantId: string): Promise<Product[]> {
    const result = await this.findAll(tenantId, {
      stockStatus: 'OUT_OF_STOCK',
    });
    return result.products;
  }

  async getCategories(tenantId: string): Promise<string[]> {
    const result = await this.prisma.product.findMany({
      where: { tenantId },
      select: { category: true },
      distinct: ['category'],
    });
    return result
      .map((item) => item.category)
      .filter((cat): cat is string => Boolean(cat));
  }

  async getBrands(tenantId: string): Promise<string[]> {
    const result = await this.prisma.product.findMany({
      where: { tenantId },
      select: { brand: true },
      distinct: ['brand'],
    });
    return result
      .map((item) => item.brand)
      .filter((brand): brand is string => Boolean(brand));
  }

  async getInventoryStats(tenantId: string): Promise<any> {
    return this.getStockSummary(tenantId);
  }

  async getStockSummary(tenantId: string): Promise<{
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalStockValue: number;
    averageStockValue: number;
  }> {
    const [total, active, lowStock, outOfStock] = await Promise.all([
      this.prisma.product.count({ where: { tenantId } }),
      this.prisma.product.count({ where: { tenantId, status: 'ACTIVE' } }),
      this.prisma.product.count({
        where: {
          tenantId,
          stock: { lte: this.prisma.product.fields.minStock },
        },
      }),
      this.prisma.product.count({ where: { tenantId, stock: 0 } }),
    ]);

    return {
      totalProducts: total,
      activeProducts: active,
      lowStockProducts: lowStock,
      outOfStockProducts: outOfStock,
      totalStockValue: 0, // Placeholder
      averageStockValue: 0, // Placeholder
    };
  }

  getStockMovements(
    _tenantId: string,
    _productId?: string,
    _startDate?: Date,
    _endDate?: Date,
    _limit?: number,
  ): Promise<any[]> {
    // Simple implementation - return empty for now
    return Promise.resolve([]);
  }

  getMostSoldProducts(
    _tenantId: string,
    _startDate?: Date,
    _endDate?: Date,
    _limit?: number,
  ): Promise<any[]> {
    // Simple implementation - return empty for now
    return Promise.resolve([]);
  }

  // Helper methods
  private toPrismaData(product: Product): Prisma.ProductUncheckedCreateInput {
    return {
      id: product.id,
      tenantId: product.tenantId,
      name: product.name,
      description: product.description,
      sku: product.sku,
      barcode: product.barcode,
      category: product.category,
      brand: product.brand,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      minStock: product.minStock,
      maxStock: product.maxStock,
      unit: product.unit,
      status: product.status as PrismaProductStatus,
      isActive: product.status === 'ACTIVE',
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private toDomain(
    productData: Prisma.ProductGetPayload<Record<string, never>>,
  ): Product {
    return new Product({
      id: productData.id,
      tenantId: productData.tenantId,
      name: productData.name,
      description: productData.description || undefined,
      sku: productData.sku || undefined,
      barcode: productData.barcode || undefined,
      category: productData.category || undefined,
      brand: productData.brand || undefined,
      price: Number(productData.price),
      cost: Number(productData.cost),
      stock: productData.stock,
      minStock: productData.minStock,
      maxStock: productData.maxStock || undefined,
      unit: productData.unit || undefined,
      status: productData.status,
      createdAt: productData.createdAt,
      updatedAt: productData.updatedAt,
    });
  }

  async findAll(
    tenantId: string,
    filters?: ProductFilters,
    sort?: ProductSortOptions,
    pagination?: { page: number; limit: number },
  ): Promise<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const where: Prisma.ProductWhereInput = { tenantId };

    if (filters) {
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { sku: { contains: filters.search, mode: 'insensitive' } },
          { barcode: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
      if (filters.category) where.category = filters.category;
      if (filters.brand) where.brand = filters.brand;
      if (filters.status) where.status = filters.status;
      if (filters.stockStatus) {
        if (filters.stockStatus === 'OUT_OF_STOCK') {
          where.stock = 0;
        } else if (filters.stockStatus === 'LOW_STOCK') {
          where.stock = { lte: this.prisma.product.fields.minStock };
        }
      }
    }

    const page = pagination?.page || 1;
    const limit = pagination?.limit || 50;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: sort ? { [sort.field]: sort.order } : { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products: products.map((p) => this.toDomain(p)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Missing required methods from ProductRepository interface
  async update(product: Product): Promise<void> {
    const data = this.toPrismaData(product);
    await this.prisma.product.update({
      where: { id: product.id, tenantId: product.tenantId },
      data,
    });
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.product.delete({
      where: { id, tenantId },
    });
  }

  async findByIds(ids: string[], tenantId: string): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids }, tenantId },
    });
    return products.map((p) => this.toDomain(p));
  }

  async findByCategory(category: string, tenantId: string): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: { category, tenantId },
    });
    return products.map((p) => this.toDomain(p));
  }

  async findByBrand(brand: string, tenantId: string): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: { brand, tenantId },
    });
    return products.map((p) => this.toDomain(p));
  }

  async findLowStock(tenantId: string): Promise<Product[]> {
    return this.getLowStockProducts(tenantId);
  }

  async findOutOfStock(tenantId: string): Promise<Product[]> {
    return this.getOutOfStockProducts(tenantId);
  }

  getCategorySummary(): Promise<
    Array<{
      category: string;
      productCount: number;
      totalValue: number;
      averagePrice: number;
    }>
  > {
    // Simple implementation
    return Promise.resolve([]);
  }

  getBrandSummary(): Promise<
    Array<{
      brand: string;
      productCount: number;
      totalValue: number;
      averagePrice: number;
    }>
  > {
    // Simple implementation
    return Promise.resolve([]);
  }

  getTopSellingProducts(
    _tenantId: string,
    _startDate: Date,
    _endDate: Date,
    _limit?: number,
  ): Promise<
    Array<{
      product: Product;
      quantitySold: number;
      revenue: number;
    }>
  > {
    // Simple implementation
    return Promise.resolve([]);
  }

  async validateStockAvailability(
    productId: string,
    quantity: number,
    tenantId: string,
  ): Promise<boolean> {
    const product = await this.findById(productId, tenantId);
    return product ? product.stock >= quantity : false;
  }

  async bulkUpdateStock(
    updates: Array<{
      productId: string;
      newStock: number;
      reason: string;
    }>,
    tenantId: string,
  ): Promise<void> {
    // Simple implementation - update each product individually
    for (const update of updates) {
      await this.prisma.product.update({
        where: { id: update.productId, tenantId },
        data: { stock: update.newStock },
      });
    }
  }
}
