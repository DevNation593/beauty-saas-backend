import { Sale, SaleStatus, PaymentMethod, SaleType } from './Sale';

export interface SaleRepository {
  save(sale: Sale): Promise<void>;
  update(sale: Sale): Promise<void>;
  findById(id: string, tenantId: string): Promise<Sale | null>;
  findByTenant(
    tenantId: string,
    filters?: SaleFilters,
    options?: Record<string, unknown>,
  ): Promise<Sale[]>;
  findByClient(clientId: string, tenantId: string): Promise<Sale[]>;
  findByStaff(
    staffId: string,
    tenantId: string,
    dateRange?: DateRange,
  ): Promise<Sale[]>;
  findByAppointment(
    appointmentId: string,
    tenantId: string,
  ): Promise<Sale | null>;
  findByDateRange(
    tenantId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Sale[]>;
  findByPaymentMethod(
    paymentMethod: PaymentMethod,
    tenantId: string,
  ): Promise<Sale[]>;
  delete(id: string, tenantId: string): Promise<void>;
  count(tenantId: string, filters?: SaleFilters): Promise<number>;
  countByTenant(tenantId: string, filters?: SaleFilters): Promise<number>;
  getAnalytics(tenantId: string, startDate: Date, endDate: Date): Promise<any>;
  getSalesReport(tenantId: string, dateRange: DateRange): Promise<any>;
  getTopItems(
    tenantId: string,
    dateRange: DateRange,
    type?: string,
  ): Promise<any>;
  getStaffPerformance(tenantId: string, dateRange: DateRange): Promise<any>;
}

export interface SaleFilters {
  status?: SaleStatus;
  type?: SaleType;
  paymentMethod?: PaymentMethod;
  staffId?: string;
  clientId?: string;
  dateRange?: DateRange;
  dateFrom?: Date;
  dateTo?: Date;
  totalMin?: number;
  totalMax?: number;
  minAmount?: number;
  maxAmount?: number;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface SaleSortOptions {
  field: 'saleDate' | 'totalAmount' | 'status' | 'clientName';
  order: 'asc' | 'desc';
}

export interface SalesAnalyticsService {
  getDailySales(tenantId: string, date: Date): Promise<SalesSummary>;
  getMonthlySales(
    tenantId: string,
    year: number,
    month: number,
  ): Promise<SalesSummary>;
  getYearlySales(tenantId: string, year: number): Promise<SalesSummary>;

  getTopSellingServices(
    tenantId: string,
    period: DateRange,
    limit?: number,
  ): Promise<TopItem[]>;
  getTopSellingProducts(
    tenantId: string,
    period: DateRange,
    limit?: number,
  ): Promise<TopItem[]>;

  getStaffPerformance(
    tenantId: string,
    period: DateRange,
  ): Promise<StaffPerformance[]>;
  getPaymentMethodDistribution(
    tenantId: string,
    period: DateRange,
  ): Promise<PaymentMethodStats[]>;

  getHourlyBreakdown(tenantId: string, date: Date): Promise<HourlySales[]>;
  getWeeklyTrends(tenantId: string, weeks: number): Promise<WeeklyTrend[]>;

  getAverageTicketSize(tenantId: string, period: DateRange): Promise<number>;
  getRefundRate(tenantId: string, period: DateRange): Promise<number>;
  getCustomerReturnRate(tenantId: string, period: DateRange): Promise<number>;
}

export interface SalesSummary {
  totalSales: number;
  totalAmount: number;
  averageTicket: number;
  refundedAmount: number;
  netAmount: number;
  transactionCount: number;
  servicesSold: number;
  productsSold: number;
  tipAmount: number;
}

export interface TopItem {
  id: string;
  name: string;
  quantitySold: number;
  totalRevenue: number;
  averagePrice: number;
  type: 'SERVICE' | 'PRODUCT';
}

export interface StaffPerformance {
  staffId: string;
  staffName: string;
  totalSales: number;
  totalAmount: number;
  averageTicket: number;
  servicesSold: number;
  productsSold: number;
  commission: number;
}

export interface PaymentMethodStats {
  method: PaymentMethod;
  count: number;
  amount: number;
  percentage: number;
}

export interface HourlySales {
  hour: number;
  sales: number;
  amount: number;
  averageTicket: number;
}

export interface WeeklyTrend {
  week: string;
  sales: number;
  amount: number;
  growth: number;
}

export interface CashRegisterService {
  openRegister(
    tenantId: string,
    staffId: string,
    openingBalance: number,
  ): Promise<CashRegister>;
  closeRegister(
    registerId: string,
    closingBalance: number,
    notes?: string,
  ): Promise<void>;
  getCurrentRegister(tenantId: string): Promise<CashRegister | null>;
  addCashTransaction(
    registerId: string,
    amount: number,
    type: 'IN' | 'OUT',
    reason: string,
  ): Promise<void>;
  getRegisterBalance(registerId: string): Promise<number>;
  getRegisterSales(registerId: string): Promise<Sale[]>;
}

export interface CashRegister {
  id: string;
  tenantId: string;
  staffId: string;
  openedAt: Date;
  closedAt?: Date;
  openingBalance: number;
  closingBalance?: number;
  expectedBalance?: number;
  difference?: number;
  status: 'OPEN' | 'CLOSED';
  notes?: string;
}

export interface InventoryService {
  checkProductAvailability(
    productId: string,
    tenantId: string,
    quantity: number,
  ): Promise<boolean>;
  reserveProductStock(
    productId: string,
    tenantId: string,
    quantity: number,
  ): Promise<void>;
  releaseProductStock(
    productId: string,
    tenantId: string,
    quantity: number,
  ): Promise<void>;
  updateProductStock(
    productId: string,
    tenantId: string,
    quantitySold: number,
  ): Promise<void>;
  getProductStock(productId: string, tenantId: string): Promise<number>;
  getLowStockProducts(tenantId: string): Promise<Product[]>;
}

export interface Product {
  id: string;
  name: string;
  currentStock: number;
  minStock: number;
  price: number;
}

export interface ReceiptService {
  generateReceipt(sale: Sale): Promise<ReceiptData>;
  emailReceipt(sale: Sale, emailAddress: string): Promise<void>;
  printReceipt(sale: Sale): Promise<void>;
}

export interface ReceiptData {
  saleId: string;
  businessName: string;
  businessAddress: string;
  date: Date;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  tax: number;
  tip: number;
  total: number;
  paymentMethod: string;
  cashierName: string;
  thankYouMessage: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}
