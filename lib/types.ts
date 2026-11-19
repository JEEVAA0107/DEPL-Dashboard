// TypeScript definitions for DEPL Textile ERP Business Intelligence Dashboard

export interface DateRangeFilter {
  fromDate: string; // YYYY-MM-DD
  toDate: string;   // YYYY-MM-DD
}

export type OrgFilter = 'ALL' | 'DEPL' | 'MTM';

export type BusinessModuleKey = 
  | 'vendor_inward'
  | 'purchase_inward'
  | 'process_delivery'
  | 'process_inward'
  | 'sales_delivery'
  | 'ibpo'
  | 'impo';

export interface KpiModuleData {
  key: BusinessModuleKey;
  title: string;
  code: string;
  primaryMetricLabel: string; // e.g. "Total DC", "Total Invoice", "Total Orders"
  primaryMetricValue: number;
  quantityMeters: number;
  revenueAmount?: number;
  prevPeriodMeters?: number;
  color: string;
  accentColor: string;
  badge: string;
  icon: string;
}

export interface KpiSummaryResponse {
  dateRange: DateRangeFilter;
  selectedOrg?: OrgFilter;
  lastRefreshed: string;
  modules: {
    vendorInward: KpiModuleData;
    purchaseInward: KpiModuleData;
    processDelivery: KpiModuleData;
    processInward: KpiModuleData;
    salesDelivery: KpiModuleData;
    ibpo: KpiModuleData;
    impo: KpiModuleData;
  };
  grandTotalMeters: number;
  grandTotalDocs: number;
  grandTotalRevenue?: number;
}

export interface DailyComparisonPoint {
  date: string;
  vendorInwardMtr: number;
  purchaseInwardMtr: number;
}

export interface ProcessFlowPoint {
  date: string;
  processDeliveryMtr: number;
  processInwardMtr: number;
}

export interface ProductionStagePoint {
  stage: string;
  meters: number;
  percentage: number;
  color: string;
}

export interface SalesTrendPoint {
  date: string;
  salesMtr: number;
  invoicesCount: number;
  movingAverageMtr: number;
}

export interface MonthlyPerformancePoint {
  month: string;
  year: number;
  salesMtr: number;
  invoices: number;
  revenue: number;
}

export interface ProcessTypeBreakdownPoint {
  processType: string;
  dcs: number;
  meters: number;
}

export interface MillBreakdownPoint {
  millName: string;
  dcs: number;
  meters: number;
}

export interface ChartsDataResponse {
  dailyInwardComparison: DailyComparisonPoint[];
  processDeliveryVsInward: ProcessFlowPoint[];
  productionStages: ProductionStagePoint[];
  salesTrend: SalesTrendPoint[];
  monthlyPerformance: MonthlyPerformancePoint[];
  topProcessTypes?: ProcessTypeBreakdownPoint[];
  topMills?: MillBreakdownPoint[];
}

export interface DailyTransactionSummaryRow {
  id: string;
  date: string; // YYYY-MM-DD
  vendorInwardDc: number;
  vendorInwardMtr: number;
  purchaseInwardDc: number;
  purchaseInwardMtr: number;
  processDeliveryDc: number;
  processDeliveryMtr: number;
  processInwardDc: number;
  processInwardMtr: number;
  salesInvoice: number;
  salesMtr: number;
  ibpoOrders: number;
  ibpoMtr: number;
  impoOrders: number;
  impoMtr: number;
}

export interface TableSummaryResponse {
  rows: DailyTransactionSummaryRow[];
  totalRecords: number;
  totals: Omit<DailyTransactionSummaryRow, 'id' | 'date'>;
}

export interface DrilldownRecord {
  docNo: string;
  date: string;
  partyName: string;
  qualitySort: string;
  lotNo?: string;
  dcNo?: string;
  dcDate?: string;
  org?: string;
  pieces: number;
  meters: number;
  ratePerMeter?: number;
  totalAmount?: number;
  processType?: string;
  status: 'Received' | 'Dispatched' | 'In-Process' | 'Invoiced' | 'Pending' | 'Completed';
  remarks?: string;
}

export interface DrilldownResponse {
  moduleKey: BusinessModuleKey;
  moduleTitle: string;
  selectedOrg?: OrgFilter;
  date?: string;
  dateRange?: { fromDate: string; toDate: string };
  totalRecords: number;
  totalMeters: number;
  records: DrilldownRecord[];
}
