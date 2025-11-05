import { Product } from './Product';

export interface ProductFilters {
  search?: string; // Search by name, sku, or barcode
  category?: string;
  brand?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  stockStatus?: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK' | 'OVERSTOCKED';
  priceMin?: number;
  priceMax?: number;
}

export interface ProductSortOptions {
  field: 'name' | 'price' | 'stock' | 'createdAt' | 'updatedAt';
  order: 'asc' | 'desc';
}

export interface ProductRepository {
  // Basic CRUD operations
  save(product: Product): Promise<void>;
  update(product: Product): Promise<void>;
  findById(id: string, tenantId: string): Promise<Product | null>;
  findBySku(sku: string, tenantId: string): Promise<Product | null>;
  findByBarcode(barcode: string, tenantId: string): Promise<Product | null>;
  delete(id: string, tenantId: string): Promise<void>;

  // Query operations
  findAll(
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
  }>;

  findByIds(ids: string[], tenantId: string): Promise<Product[]>;
  findByCategory(category: string, tenantId: string): Promise<Product[]>;
  findByBrand(brand: string, tenantId: string): Promise<Product[]>;
  findLowStock(tenantId: string): Promise<Product[]>;
  findOutOfStock(tenantId: string): Promise<Product[]>;

  // Additional required methods for query handlers
  existsBySku(sku: string, tenantId: string): Promise<boolean>;
  existsByBarcode(barcode: string, tenantId: string): Promise<boolean>;
  findByTenant(
    tenantId: string,
    filters?: ProductFilters,
    options?: { page: number; limit: number },
  ): Promise<Product[]>;
  countByTenant(tenantId: string, filters?: ProductFilters): Promise<number>;
  getLowStockProducts(tenantId: string): Promise<Product[]>;
  getOutOfStockProducts(tenantId: string): Promise<Product[]>;
  getCategories(tenantId: string): Promise<string[]>;
  getBrands(tenantId: string): Promise<string[]>;
  getInventoryStats(tenantId: string): Promise<any>;
  getStockMovements(
    tenantId: string,
    productId?: string,
    startDate?: Date,
    endDate?: Date,
    limit?: number,
  ): Promise<any[]>;
  getMostSoldProducts(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
    limit?: number,
  ): Promise<any[]>;

  // Analytics and reports
  getStockSummary(tenantId: string): Promise<{
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalStockValue: number;
    averageStockValue: number;
  }>;

  getCategorySummary(tenantId: string): Promise<
    Array<{
      category: string;
      productCount: number;
      totalValue: number;
      averagePrice: number;
    }>
  >;

  getBrandSummary(tenantId: string): Promise<
    Array<{
      brand: string;
      productCount: number;
      totalValue: number;
      averagePrice: number;
    }>
  >;

  getTopSellingProducts(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    limit?: number,
  ): Promise<
    Array<{
      product: Product;
      quantitySold: number;
      revenue: number;
    }>
  >;

  // Inventory operations
  validateStockAvailability(
    productId: string,
    quantity: number,
    tenantId: string,
  ): Promise<boolean>;

  bulkUpdateStock(
    updates: Array<{
      productId: string;
      newStock: number;
      reason: string;
    }>,
    tenantId: string,
  ): Promise<void>;
}

export interface StockMovementService {
  recordMovement(
    productId: string,
    type: 'IN' | 'OUT' | 'ADJUSTMENT',
    quantity: number,
    reason: string,
    reference?: string,
    createdBy?: string,
    tenantId?: string,
  ): Promise<void>;

  getMovementHistory(
    productId: string,
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
    pagination?: { page: number; limit: number },
  ): Promise<{
    movements: Array<{
      id: string;
      type: 'IN' | 'OUT' | 'ADJUSTMENT';
      quantity: number;
      reason: string;
      reference?: string;
      balanceBefore: number;
      balanceAfter: number;
      createdBy: string;
      createdAt: Date;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  getStockReport(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalMovements: number;
    totalIn: number;
    totalOut: number;
    totalAdjustments: number;
    netChange: number;
    topProducts: Array<{
      productId: string;
      productName: string;
      totalMovements: number;
      netChange: number;
    }>;
  }>;
}

export interface ProductImportService {
  importFromCsv(
    file: Buffer,
    tenantId: string,
    options?: {
      skipDuplicates?: boolean;
      updateExisting?: boolean;
    },
  ): Promise<{
    imported: number;
    updated: number;
    skipped: number;
    errors: Array<{
      row: number;
      error: string;
    }>;
  }>;

  exportToCsv(tenantId: string, filters?: ProductFilters): Promise<Buffer>;

  exportToExcel(tenantId: string, filters?: ProductFilters): Promise<Buffer>;

  generateBarcodes(
    productIds: string[],
    tenantId: string,
    format?: 'CODE128' | 'EAN13',
  ): Promise<
    Array<{
      productId: string;
      barcode: string;
      barcodeImage: Buffer;
    }>
  >;
}

export interface CategoryService {
  getCategories(tenantId: string): Promise<
    Array<{
      name: string;
      productCount: number;
      totalValue: number;
    }>
  >;

  createCategory(name: string, tenantId: string): Promise<void>;
  updateCategory(
    oldName: string,
    newName: string,
    tenantId: string,
  ): Promise<void>;
  deleteCategory(name: string, tenantId: string): Promise<void>;
  mergeCategories(
    categories: string[],
    newCategory: string,
    tenantId: string,
  ): Promise<void>;
}

export interface BrandService {
  getBrands(tenantId: string): Promise<
    Array<{
      name: string;
      productCount: number;
      totalValue: number;
    }>
  >;

  createBrand(name: string, tenantId: string): Promise<void>;
  updateBrand(
    oldName: string,
    newName: string,
    tenantId: string,
  ): Promise<void>;
  deleteBrand(name: string, tenantId: string): Promise<void>;
  mergeBrands(
    brands: string[],
    newBrand: string,
    tenantId: string,
  ): Promise<void>;
}

export interface AlertService {
  getLowStockAlerts(tenantId: string): Promise<
    Array<{
      product: Product;
      currentStock: number;
      minStock: number;
      daysUntilOutOfStock?: number;
    }>
  >;

  getOutOfStockAlerts(tenantId: string): Promise<
    Array<{
      product: Product;
      daysSinceOutOfStock: number;
      lastSaleDate?: Date;
    }>
  >;

  getOverstockedAlerts(tenantId: string): Promise<
    Array<{
      product: Product;
      currentStock: number;
      maxStock: number;
      excessStock: number;
    }>
  >;

  createStockAlert(
    productId: string,
    alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCKED',
    tenantId: string,
  ): Promise<void>;

  markAlertAsRead(alertId: string, tenantId: string): Promise<void>;
  markAllAlertsAsRead(tenantId: string): Promise<void>;
}
