/**
 * Database Adapter & Query Layer for DEPL Textile ERP
 * 
 * STRICT DATABASE-FIRST POLICY:
 * - Read-Only access only (SELECT queries with WITH (NOLOCK))
 * - Zero write operations (INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE are blocked)
 * - Prepared / parameterized queries to protect performance and safety
 * - 100% computed from real database records (Zero fabricated / fake metrics)
 */

import sql from 'mssql';
import { 
  DailyTransactionSummaryRow, 
  KpiSummaryResponse, 
  ChartsDataResponse, 
  DrilldownResponse, 
  BusinessModuleKey,
  OrgFilter
} from './types';

// Connection pool singleton
let pool: sql.ConnectionPool | null = null;

function getPoolConfig(): sql.config {
  return {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || 'Dinesh@01',
    server: process.env.DB_HOST || '192.168.0.150',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
    database: process.env.DB_NAME || 'Dinesh_Weaving_ERP',
    options: {
      encrypt: false,
      trustServerCertificate: true,
      readOnlyIntent: true,
    },
    connectionTimeout: 15000,
    requestTimeout: 60000,
    pool: {
      max: 15,
      min: 2,
      idleTimeoutMillis: 60000,
    }
  };
}

async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool || !pool.connected) {
    try {
      pool = await sql.connect(getPoolConfig());
    } catch (err) {
      console.error('Failed to connect to SQL Server:', err);
      throw err;
    }
  }
  return pool;
}

export function isLiveDbConfigured(): boolean {
  return Boolean(process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER);
}

export function validateReadOnlyQuery(sqlQuery: string): boolean {
  const forbiddenKeywords = [
    'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 
    'CREATE', 'RENAME', 'GRANT', 'REVOKE', 'EXEC', 'EXECUTE'
  ];
  const cleaned = sqlQuery.trim().toUpperCase();
  for (const keyword of forbiddenKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(cleaned)) {
      throw new Error(`SECURITY ALERT: Prohibited SQL keyword '${keyword}'. Dashboard only executes read-only SELECT queries.`);
    }
  }
  return true;
}

/**
 * Fetch KPI Summary across all 7 business modules strictly from real database records
 */
export async function getKpiSummaryData(fromDate?: string, toDate?: string, org: OrgFilter = 'DEPL'): Promise<KpiSummaryResponse> {
  try {
    const db = await getPool();
    const request = db.request();

    const from = fromDate || '2026-10-18';
    const to = toDate || '2026-11-18';

    request.input('from', sql.Date, from);
    request.input('to', sql.Date, to);

    const orgFilter = (org === 'ALL' || !org) ? null : org;
    request.input('org', sql.VarChar(50), orgFilter);

    const q = `
      SELECT 
        ISNULL(vipi.vi_dc, 0) as vi_dc,
        ISNULL(vipi.vi_mtr, 0) as vi_mtr,
        ISNULL(vipi.pi_dc, 0) as pi_dc,
        ISNULL(vipi.pi_mtr, 0) as pi_mtr,
        ISNULL(pd.pd_dc, 0) as pd_dc,
        ISNULL(pd.pd_mtr, 0) as pd_mtr,
        ISNULL(pIn.proc_dc, 0) as proc_dc,
        ISNULL(pIn.proc_mtr, 0) as proc_mtr,
        ISNULL(sd.sd_inv, 0) as sd_inv,
        ISNULL(sd.sd_mtr, 0) as sd_mtr,
        ISNULL(sd.sd_revenue, 0) as sd_revenue,
        ISNULL(ord.ib_ord, 0) as ib_ord,
        ISNULL(ord.ib_mtr, 0) as ib_mtr,
        ISNULL(ord.im_ord, 0) as im_ord,
        ISNULL(ord.im_mtr, 0) as im_mtr
      FROM (SELECT 1 as x) dummy
      OUTER APPLY (
        SELECT 
          COUNT(DISTINCT CASE WHEN Inw_type = 'Vendor' THEN DCNo END) as vi_dc,
          SUM(CASE WHEN Inw_type = 'Vendor' THEN Mtr ELSE 0 END) as vi_mtr,
          COUNT(DISTINCT CASE WHEN Inw_type = 'Purchase' THEN DCNo END) as pi_dc,
          SUM(CASE WHEN Inw_type = 'Purchase' THEN Mtr ELSE 0 END) as pi_mtr
        FROM [Vendor_Cloth_Inw] WITH (NOLOCK)
        WHERE Inwdt >= @from AND Inwdt <= @to
          AND (@org IS NULL OR Org_sh = @org)
      ) vipi
      OUTER APPLY (
        SELECT 
          COUNT(DISTINCT Dcno) as pd_dc, 
          SUM(Mtr) as pd_mtr
        FROM [Cloth_Delivery] WITH (NOLOCK)
        WHERE Dcdt >= @from AND Dcdt <= @to
          AND (@org IS NULL OR Org_sh = @org)
      ) pd
      OUTER APPLY (
        SELECT 
          COUNT(DISTINCT DCNo) as proc_dc, 
          SUM(Mtr) as proc_mtr
        FROM [Cloth_Final_Inw] WITH (NOLOCK)
        WHERE Inw_type = 'Process Inward' AND Inwdt >= @from AND Inwdt <= @to
          AND (@org IS NULL OR Org_sh = @org)
      ) pIn
      OUTER APPLY (
        SELECT 
          COUNT(DISTINCT invno) as sd_inv, 
          SUM(ToMtr) as sd_mtr, 
          SUM(NetAmt) as sd_revenue
        FROM [Fab_Sales] WITH (NOLOCK)
        WHERE ISNULL(cancel, 0) = 0 AND INVDt >= @from AND INVDt <= @to
          AND (@org IS NULL OR Org_sh = @org)
      ) sd
      OUTER APPLY (
        SELECT 
          COUNT(DISTINCT CASE WHEN ord_type <> 'Management Order' THEN pono END) as ib_ord,
          SUM(CASE WHEN ord_type <> 'Management Order' THEN CAST(Order_Mtr as float) ELSE 0 END) as ib_mtr,
          COUNT(DISTINCT CASE WHEN ord_type = 'Management Order' THEN pono END) as im_ord,
          SUM(CASE WHEN ord_type = 'Management Order' THEN CAST(Order_Mtr as float) ELSE 0 END) as im_mtr
        FROM [IBPO] WITH (NOLOCK)
        WHERE refdt >= @from AND refdt <= @to
          AND (@org IS NULL OR Org_sh = @org)
      ) ord
    `;

    validateReadOnlyQuery(q);
    const result = await request.query(q);
    const row = result.recordset[0] || {};

    const viMtr = Math.round(row.vi_mtr || 0);
    const piMtr = Math.round(row.pi_mtr || 0);
    const pdMtr = Math.round(row.pd_mtr || 0);
    const procMtr = Math.round(row.proc_mtr || 0);
    const sdMtr = Math.round(row.sd_mtr || 0);
    const sdRevenue = Math.round(row.sd_revenue || 0);
    const ibMtr = Math.round(row.ib_mtr || 0);
    const imMtr = Math.round(row.im_mtr || 0);

    const grandTotalMeters = viMtr + piMtr + pdMtr + procMtr + sdMtr + ibMtr + imMtr;
    const grandTotalDocs = (row.vi_dc || 0) + (row.pi_dc || 0) + (row.pd_dc || 0) + (row.proc_dc || 0) + (row.sd_inv || 0) + (row.ib_ord || 0) + (row.im_ord || 0);

    return {
      dateRange: { fromDate: from, toDate: to },
      selectedOrg: org,
      lastRefreshed: new Date().toISOString(),
      modules: {
        vendorInward: {
          key: 'vendor_inward',
          title: 'Vendor Inward',
          code: 'VI-01',
          primaryMetricLabel: 'Total DC',
          primaryMetricValue: row.vi_dc || 0,
          quantityMeters: viMtr,
          color: '#2563EB',
          accentColor: '#1D4ED8',
          badge: 'VI-01',
          icon: 'inward',
        },
        purchaseInward: {
          key: 'purchase_inward',
          title: 'Purchase Inward',
          code: 'PI-02',
          primaryMetricLabel: 'Total DC',
          primaryMetricValue: row.pi_dc || 0,
          quantityMeters: piMtr,
          color: '#4F46E5',
          accentColor: '#4338CA',
          badge: 'PI-02',
          icon: 'inward',
        },
        processDelivery: {
          key: 'process_delivery',
          title: 'Process Delivery',
          code: 'PD-03',
          primaryMetricLabel: 'Total DC',
          primaryMetricValue: row.pd_dc || 0,
          quantityMeters: pdMtr,
          color: '#0D9488',
          accentColor: '#0F766E',
          badge: 'PD-03',
          icon: 'process',
        },
        processInward: {
          key: 'process_inward',
          title: 'Process Inward',
          code: 'PI-04',
          primaryMetricLabel: 'Total DC',
          primaryMetricValue: row.proc_dc || 0,
          quantityMeters: procMtr,
          color: '#059669',
          accentColor: '#047857',
          badge: 'PI-04',
          icon: 'process',
        },
        salesDelivery: {
          key: 'sales_delivery',
          title: 'Sales Delivery',
          code: 'SD-05',
          primaryMetricLabel: 'Total Invoice',
          primaryMetricValue: row.sd_inv || 0,
          quantityMeters: sdMtr,
          revenueAmount: sdRevenue,
          color: '#7C3AED',
          accentColor: '#6D28D9',
          badge: 'SD-05',
          icon: 'sales',
        },
        ibpo: {
          key: 'ibpo',
          title: 'IBPO Orders',
          code: 'IB-06',
          primaryMetricLabel: 'Total Orders',
          primaryMetricValue: row.ib_ord || 0,
          quantityMeters: ibMtr,
          color: '#0284C7',
          accentColor: '#0369A1',
          badge: 'IB-06',
          icon: 'orders',
        },
        impo: {
          key: 'impo',
          title: 'IMPO Orders',
          code: 'IM-07',
          primaryMetricLabel: 'Total Orders',
          primaryMetricValue: row.im_ord || 0,
          quantityMeters: imMtr,
          color: '#E11D48',
          accentColor: '#BE123C',
          badge: 'IM-07',
          icon: 'orders',
        },
      },
      grandTotalMeters,
      grandTotalDocs,
      grandTotalRevenue: sdRevenue,
    };
  } catch (err: any) {
    console.error('Error querying live ERP metrics:', err);
    throw new Error(`Database KPI Query Failed: ${err.message}`);
  }
}

/**
 * Fetch Analytics Charts Data strictly from real database records (Real Sales, Real Processes, Real Mills, Real Monthly History)
 */
export async function getChartsData(fromDate?: string, toDate?: string, org: OrgFilter = 'DEPL'): Promise<ChartsDataResponse> {
  try {
    const db = await getPool();
    const tableRes = await getSummaryTableData(fromDate, toDate, undefined, undefined, 'desc', org);
    const rows = [...tableRes.rows].reverse(); // chronological order

    // 1. Real Daily Sales Dispatches & Moving Average
    const salesTrend = rows.map((r, idx, arr) => {
      const windowStart = Math.max(0, idx - 4);
      const windowRows = arr.slice(windowStart, idx + 1);
      const ma = Math.round(windowRows.reduce((sum, curr) => sum + curr.salesMtr, 0) / windowRows.length);
      return {
        date: r.date,
        salesMtr: r.salesMtr,
        invoicesCount: r.salesInvoice,
        movingAverageMtr: ma,
      };
    });

    const dailyInwardComparison = rows.map(r => ({
      date: r.date,
      vendorInwardMtr: r.vendorInwardMtr,
      purchaseInwardMtr: r.purchaseInwardMtr,
    }));

    const processDeliveryVsInward = rows.map(r => ({
      date: r.date,
      processDeliveryMtr: r.processDeliveryMtr,
      processInwardMtr: r.processInwardMtr,
    }));

    const totalInward = tableRes.totals.vendorInwardMtr + tableRes.totals.purchaseInwardMtr;
    const totalProc = tableRes.totals.processDeliveryMtr + tableRes.totals.processInwardMtr;
    const totalSales = tableRes.totals.salesMtr;
    const totalAll = totalInward + totalProc + totalSales || 1;

    const productionStages = [
      { stage: 'Fabric Inward', meters: Math.round(totalInward), percentage: Math.round((totalInward / totalAll) * 100), color: '#2563EB' },
      { stage: 'Mill Processing', meters: Math.round(totalProc), percentage: Math.round((totalProc / totalAll) * 100), color: '#0D9488' },
      { stage: 'Sales Dispatched', meters: Math.round(totalSales), percentage: Math.round((totalSales / totalAll) * 100), color: '#7C3AED' },
    ];

    const orgFilter = (org === 'ALL' || !org) ? null : org;

    // 2. Real Historical Monthly Sales History (Direct from Fab_Sales)
    const monthlyReq = db.request();
    monthlyReq.input('org', sql.VarChar(50), orgFilter);
    const monthlyQ = `
      SELECT 
        DATENAME(month, INVDt) as monthName,
        MONTH(INVDt) as monthNum,
        YEAR(INVDt) as yr,
        COUNT(DISTINCT invno) as totalInvoices,
        ROUND(SUM(ToMtr), 2) as totalMeters,
        ROUND(SUM(NetAmt), 2) as totalRevenue
      FROM [Fab_Sales] WITH (NOLOCK)
      WHERE ISNULL(cancel, 0) = 0
        AND INVDt >= DATEADD(month, -6, GETDATE())
        AND (@org IS NULL OR Org_sh = @org)
      GROUP BY YEAR(INVDt), MONTH(INVDt), DATENAME(month, INVDt)
      ORDER BY yr, monthNum
    `;
    validateReadOnlyQuery(monthlyQ);
    const monthlyRes = await monthlyReq.query(monthlyQ);

    const monthlyPerformance = monthlyRes.recordset.map((r: any) => ({
      month: r.monthName.slice(0, 3),
      year: r.yr,
      salesMtr: Math.round(r.totalMeters || 0),
      invoices: r.totalInvoices || 0,
      revenue: Math.round(r.totalRevenue || 0),
    }));

    // 3. Real Top Process Types from Cloth_Delivery
    const from = fromDate || '2026-10-18';
    const to = toDate || '2026-11-18';
    const procReq = db.request();
    procReq.input('from', sql.Date, from);
    procReq.input('to', sql.Date, to);
    procReq.input('org', sql.VarChar(50), orgFilter);

    const procQ = `
      SELECT TOP 6
        ISNULL(Process_type, 'General Processing') as processType,
        COUNT(DISTINCT Dcno) as dcs,
        ROUND(SUM(Mtr), 2) as meters
      FROM [Cloth_Delivery] WITH (NOLOCK)
      WHERE Dcdt >= @from AND Dcdt <= @to
        AND (@org IS NULL OR Org_sh = @org)
      GROUP BY Process_type
      ORDER BY meters DESC
    `;
    validateReadOnlyQuery(procQ);
    const procRes = await procReq.query(procQ);

    const topProcessTypes = procRes.recordset.map((r: any) => ({
      processType: r.processType,
      dcs: r.dcs,
      meters: Math.round(r.meters),
    }));

    // 4. Real Top Processing Mills from Cloth_Delivery
    const millReq = db.request();
    millReq.input('from', sql.Date, from);
    millReq.input('to', sql.Date, to);
    millReq.input('org', sql.VarChar(50), orgFilter);

    const millQ = `
      SELECT TOP 6
        Vendor_Name as millName,
        COUNT(DISTINCT Dcno) as dcs,
        ROUND(SUM(Mtr), 2) as meters
      FROM [Cloth_Delivery] WITH (NOLOCK)
      WHERE Dcdt >= @from AND Dcdt <= @to
        AND (@org IS NULL OR Org_sh = @org)
      GROUP BY Vendor_Name
      ORDER BY meters DESC
    `;
    validateReadOnlyQuery(millQ);
    const millRes = await millReq.query(millQ);

    const topMills = millRes.recordset.map((r: any) => ({
      millName: r.millName,
      dcs: r.dcs,
      meters: Math.round(r.meters),
    }));

    return {
      dailyInwardComparison,
      processDeliveryVsInward,
      productionStages,
      salesTrend,
      monthlyPerformance,
      topProcessTypes,
      topMills,
    };
  } catch (err: any) {
    console.error('Error fetching charts from live ERP:', err);
    throw new Error(`Database Charts Query Failed: ${err.message}`);
  }
}

// Short-lived in-flight promise cache to avoid running duplicate heavy summary CTE queries concurrently
const summaryInFlightCache = new Map<string, Promise<{ rows: DailyTransactionSummaryRow[]; totalRecords: number; totals: any }>>();

/**
 * Fetch Daily Summary Table with Server-side Filtering and Sorting from live SQL Server
 */
export async function getSummaryTableData(
  fromDate?: string, 
  toDate?: string, 
  searchQuery?: string,
  sortColumn?: keyof DailyTransactionSummaryRow,
  sortDirection: 'asc' | 'desc' = 'desc',
  org: OrgFilter = 'DEPL'
): Promise<{ rows: DailyTransactionSummaryRow[]; totalRecords: number; totals: any }> {
  const cacheKey = `${fromDate || 'default'}_${toDate || 'default'}_${org || 'ALL'}`;

  // If a standard summary query (without custom search or sort) is already running for this date range, reuse the promise
  if (!searchQuery && !sortColumn && summaryInFlightCache.has(cacheKey)) {
    return summaryInFlightCache.get(cacheKey)!;
  }

  const queryPromise = (async () => {
    try {
      const db = await getPool();
      const request = db.request();

      const from = fromDate || '2026-10-18';
      const to = toDate || '2026-11-18';

      request.input('from', sql.Date, from);
      request.input('to', sql.Date, to);

      const orgFilter = (org === 'ALL' || !org) ? null : org;
      request.input('org', sql.VarChar(50), orgFilter);

      const q = `
        WITH Dates AS (
          SELECT DISTINCT CAST(INVDt AS DATE) as dDate FROM [Fab_Sales] WITH (NOLOCK)
          WHERE INVDt >= @from AND INVDt <= @to AND ISNULL(cancel, 0) = 0 AND (@org IS NULL OR Org_sh = @org)
          UNION
          SELECT DISTINCT CAST(Inwdt AS DATE) as dDate FROM [Vendor_Cloth_Inw] WITH (NOLOCK)
          WHERE Inwdt >= @from AND Inwdt <= @to AND (@org IS NULL OR Org_sh = @org)
          UNION
          SELECT DISTINCT CAST(Dcdt AS DATE) as dDate FROM [Cloth_Delivery] WITH (NOLOCK)
          WHERE Dcdt >= @from AND Dcdt <= @to AND (@org IS NULL OR Org_sh = @org)
          UNION
          SELECT DISTINCT CAST(Inwdt AS DATE) as dDate FROM [Cloth_Final_Inw] WITH (NOLOCK)
          WHERE Inwdt >= @from AND Inwdt <= @to AND (@org IS NULL OR Org_sh = @org)
        ),
        VI AS (
          SELECT CAST(Inwdt AS DATE) as dDate, COUNT(DISTINCT DCNo) as viDc, SUM(Mtr) as viMtr
          FROM [Vendor_Cloth_Inw] WITH (NOLOCK)
          WHERE Inw_type = 'Vendor' AND Inwdt >= @from AND Inwdt <= @to AND (@org IS NULL OR Org_sh = @org)
          GROUP BY CAST(Inwdt AS DATE)
        ),
        PI AS (
          SELECT CAST(Inwdt AS DATE) as dDate, COUNT(DISTINCT DCNo) as piDc, SUM(Mtr) as piMtr
          FROM [Vendor_Cloth_Inw] WITH (NOLOCK)
          WHERE Inw_type = 'Purchase' AND Inwdt >= @from AND Inwdt <= @to AND (@org IS NULL OR Org_sh = @org)
          GROUP BY CAST(Inwdt AS DATE)
        ),
        PD AS (
          SELECT CAST(Dcdt AS DATE) as dDate, COUNT(DISTINCT Dcno) as pdDc, SUM(Mtr) as pdMtr
          FROM [Cloth_Delivery] WITH (NOLOCK)
          WHERE Dcdt >= @from AND Dcdt <= @to AND (@org IS NULL OR Org_sh = @org)
          GROUP BY CAST(Dcdt AS DATE)
        ),
        ProcIn AS (
          SELECT CAST(Inwdt AS DATE) as dDate, COUNT(DISTINCT DCNo) as procDc, SUM(Mtr) as procMtr
          FROM [Cloth_Final_Inw] WITH (NOLOCK)
          WHERE Inw_type = 'Process Inward' AND Inwdt >= @from AND Inwdt <= @to AND (@org IS NULL OR Org_sh = @org)
          GROUP BY CAST(Inwdt AS DATE)
        ),
        SD AS (
          SELECT CAST(INVDt AS DATE) as dDate, COUNT(DISTINCT invno) as sdInv, SUM(ToMtr) as sdMtr
          FROM [Fab_Sales] WITH (NOLOCK)
          WHERE ISNULL(cancel, 0) = 0 AND INVDt >= @from AND INVDt <= @to AND (@org IS NULL OR Org_sh = @org)
          GROUP BY CAST(INVDt AS DATE)
        ),
        IB AS (
          SELECT CAST(refdt AS DATE) as dDate, COUNT(DISTINCT pono) as ibpoOrd, SUM(CAST(Order_Mtr as float)) as ibpoMtr
          FROM [IBPO] WITH (NOLOCK)
          WHERE ord_type <> 'Management Order' AND refdt >= @from AND refdt <= @to AND (@org IS NULL OR Org_sh = @org)
          GROUP BY CAST(refdt AS DATE)
        ),
        IM AS (
          SELECT CAST(refdt AS DATE) as dDate, COUNT(DISTINCT pono) as impoOrd, SUM(CAST(Order_Mtr as float)) as impoMtr
          FROM [IBPO] WITH (NOLOCK)
          WHERE ord_type = 'Management Order' AND refdt >= @from AND refdt <= @to AND (@org IS NULL OR Org_sh = @org)
          GROUP BY CAST(refdt AS DATE)
        )
        SELECT 
          CONVERT(varchar(10), d.dDate, 23) as date,
          ISNULL(vi.viDc, 0) as vendorInwardDc,
          ROUND(ISNULL(vi.viMtr, 0), 2) as vendorInwardMtr,
          ISNULL(pi.piDc, 0) as purchaseInwardDc,
          ROUND(ISNULL(pi.piMtr, 0), 2) as purchaseInwardMtr,
          ISNULL(pd.pdDc, 0) as processDeliveryDc,
          ROUND(ISNULL(pd.pdMtr, 0), 2) as processDeliveryMtr,
          ISNULL(pIn.procDc, 0) as processInwardDc,
          ROUND(ISNULL(pIn.procMtr, 0), 2) as processInwardMtr,
          ISNULL(sd.sdInv, 0) as salesInvoice,
          ROUND(ISNULL(sd.sdMtr, 0), 2) as salesMtr,
          ISNULL(ib.ibpoOrd, 0) as ibpoOrders,
          ROUND(ISNULL(ib.ibpoMtr, 0), 2) as ibpoMtr,
          ISNULL(im.impoOrd, 0) as impoOrders,
          ROUND(ISNULL(im.impoMtr, 0), 2) as impoMtr
        FROM Dates d
        LEFT JOIN VI vi ON d.dDate = vi.dDate
        LEFT JOIN PI pi ON d.dDate = pi.dDate
        LEFT JOIN PD pd ON d.dDate = pd.dDate
        LEFT JOIN ProcIn pIn ON d.dDate = pIn.dDate
        LEFT JOIN SD sd ON d.dDate = sd.dDate
        LEFT JOIN IB ib ON d.dDate = ib.dDate
        LEFT JOIN IM im ON d.dDate = im.dDate
        ORDER BY d.dDate DESC
      `;

      validateReadOnlyQuery(q);
      const result = await request.query(q);

      let rows: DailyTransactionSummaryRow[] = result.recordset.map((r, i) => ({
        id: `live-${r.date}-${i}`,
        date: r.date,
        vendorInwardDc: r.vendorInwardDc,
        vendorInwardMtr: r.vendorInwardMtr,
        purchaseInwardDc: r.purchaseInwardDc,
        purchaseInwardMtr: r.purchaseInwardMtr,
        processDeliveryDc: r.processDeliveryDc,
        processDeliveryMtr: r.processDeliveryMtr,
        processInwardDc: r.processInwardDc,
        processInwardMtr: r.processInwardMtr,
        salesInvoice: r.salesInvoice,
        salesMtr: r.salesMtr,
        ibpoOrders: r.ibpoOrders,
        ibpoMtr: r.ibpoMtr,
        impoOrders: r.impoOrders,
        impoMtr: r.impoMtr,
      }));

      if (searchQuery && searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        rows = rows.filter(r => r.date.includes(q));
      }

      if (sortColumn) {
        rows.sort((a, b) => {
          const valA = a[sortColumn];
          const valB = b[sortColumn];
          if (typeof valA === 'string' && typeof valB === 'string') {
            return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
          }
          return sortDirection === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
        });
      }

      const totals = rows.reduce((acc, curr) => ({
        vendorInwardDc: acc.vendorInwardDc + curr.vendorInwardDc,
        vendorInwardMtr: acc.vendorInwardMtr + curr.vendorInwardMtr,
        purchaseInwardDc: acc.purchaseInwardDc + curr.purchaseInwardDc,
        purchaseInwardMtr: acc.purchaseInwardMtr + curr.purchaseInwardMtr,
        processDeliveryDc: acc.processDeliveryDc + curr.processDeliveryDc,
        processDeliveryMtr: acc.processDeliveryMtr + curr.processDeliveryMtr,
        processInwardDc: acc.processInwardDc + curr.processInwardDc,
        processInwardMtr: acc.processInwardMtr + curr.processInwardMtr,
        salesInvoice: acc.salesInvoice + curr.salesInvoice,
        salesMtr: acc.salesMtr + curr.salesMtr,
        ibpoOrders: acc.ibpoOrders + curr.ibpoOrders,
        ibpoMtr: acc.ibpoMtr + curr.ibpoMtr,
        impoOrders: acc.impoOrders + curr.impoOrders,
        impoMtr: acc.impoMtr + curr.impoMtr,
      }), {
        vendorInwardDc: 0, vendorInwardMtr: 0,
        purchaseInwardDc: 0, purchaseInwardMtr: 0,
        processDeliveryDc: 0, processDeliveryMtr: 0,
        processInwardDc: 0, processInwardMtr: 0,
        salesInvoice: 0, salesMtr: 0,
        ibpoOrders: 0, ibpoMtr: 0,
        impoOrders: 0, impoMtr: 0,
      });

      return {
        rows,
        totalRecords: rows.length,
        totals,
      };
    } catch (err: any) {
      console.error('Error querying summary from live ERP:', err);
      throw new Error(`Database Summary Query Failed: ${err.message}`);
    }
  })();

  if (!searchQuery && !sortColumn) {
    summaryInFlightCache.set(cacheKey, queryPromise);
    queryPromise.finally(() => {
      setTimeout(() => summaryInFlightCache.delete(cacheKey), 5000);
    });
  }

  return queryPromise;
}

/**
 * Fetch Detailed Itemized Drilldown Transactions for any KPI module strictly from SQL Server
 */
export async function getDrilldownData(
  moduleKey: BusinessModuleKey, 
  date?: string,
  fromDate?: string,
  toDate?: string,
  org: OrgFilter = 'DEPL'
): Promise<DrilldownResponse> {
  try {
    const db = await getPool();
    const request = db.request();

    const from = date || fromDate || '2026-10-20';
    const to = date || toDate || '2026-11-18';

    request.input('from', sql.Date, from);
    request.input('to', sql.Date, to);

    const orgFilter = (org === 'ALL' || !org) ? null : org;
    request.input('org', sql.VarChar(50), orgFilter);

    let q = '';
    let moduleTitle = '';

    if (moduleKey === 'vendor_inward') {
      moduleTitle = 'Vendor Inward (VI-01)';
      q = `
        SELECT TOP 2500
          refno as inwId,
          CONVERT(varchar(10), Inwdt, 23) as inwDate,
          ISNULL(Lotno, '-') as lotNo,
          Inw_type as inwType,
          ISNULL(yname, '-') as vendorName,
          ISNULL(DCNo, '-') as dcNo,
          CONVERT(varchar(10), Dcdt, 23) as dcDate,
          ROUND(ISNULL(TMtr, 0), 2) as totalMtrs,
          ISNULL(TPCNO, 0) as pieces,
          ISNULL(DesignNo, '-') as spNo,
          ISNULL(Fabric_Name, '-') as fabricName,
          ISNULL(Org_sh, 'DEPL') as org
        FROM (
          SELECT 
            refno,
            Inwdt,
            Lotno,
            Inw_type,
            yname,
            DCNo,
            Dcdt,
            TMtr,
            TPCNO,
            DesignNo,
            Fabric_Name,
            Org_sh,
            ROW_NUMBER() OVER (PARTITION BY refno, Lotno ORDER BY Sno ASC) as rn
          FROM [Vendor_Cloth_Inw] WITH (NOLOCK)
          WHERE Inw_type = 'Vendor'
            AND Inwdt >= @from AND Inwdt <= @to
            AND (@org IS NULL OR Org_sh = @org)
        ) sub
        WHERE rn = 1
        ORDER BY refno DESC
      `;
    } else if (moduleKey === 'purchase_inward') {
      moduleTitle = 'Purchase Inward (PI-02)';
      q = `
        SELECT TOP 2500
          refno as inwId,
          CONVERT(varchar(10), Inwdt, 23) as inwDate,
          ISNULL(Lotno, '-') as lotNo,
          Inw_type as inwType,
          ISNULL(yname, '-') as vendorName,
          ISNULL(DCNo, '-') as dcNo,
          CONVERT(varchar(10), Dcdt, 23) as dcDate,
          ROUND(ISNULL(TMtr, 0), 2) as totalMtrs,
          ISNULL(TPCNO, 0) as pieces,
          ISNULL(DesignNo, '-') as spNo,
          ISNULL(Fabric_Name, '-') as fabricName,
          ISNULL(Org_sh, 'DEPL') as org
        FROM (
          SELECT 
            refno,
            Inwdt,
            Lotno,
            Inw_type,
            yname,
            DCNo,
            Dcdt,
            TMtr,
            TPCNO,
            DesignNo,
            Fabric_Name,
            Org_sh,
            ROW_NUMBER() OVER (PARTITION BY refno, Lotno ORDER BY Sno ASC) as rn
          FROM [Vendor_Cloth_Inw] WITH (NOLOCK)
          WHERE Inw_type = 'Purchase'
            AND Inwdt >= @from AND Inwdt <= @to
            AND (@org IS NULL OR Org_sh = @org)
        ) sub
        WHERE rn = 1
        ORDER BY refno DESC
      `;
    } else if (moduleKey === 'process_delivery') {
      moduleTitle = 'Process Delivery (PD-03)';
      q = `
        SELECT TOP 2500
          CAST(Dcno as varchar(50)) as dcNo,
          CONVERT(varchar(10), Dcdt, 23) as dcDate,
          ISNULL(Process_type, '-') as processType,
          ISNULL(Vendor_Name, '-') as millName,
          ISNULL(Lotno, '-') as lotNo,
          ISNULL(DesignNo, '-') as spNo,
          ISNULL(Fabric_Name, '-') as fabricName,
          ISNULL(TPcno, 0) as pieces,
          ROUND(ISNULL(totalMtr, 0), 2) as totalMtrs,
          ISNULL(Org_sh, 'DEPL') as org
        FROM (
          SELECT 
            Dcno,
            Dcdt,
            Process_type,
            Vendor_Name,
            Lotno,
            DesignNo,
            Fabric_Name,
            TPcno,
            totalMtr,
            Org_sh,
            ROW_NUMBER() OVER (PARTITION BY Dcno, Lotno ORDER BY Sno ASC) as rn
          FROM [Cloth_Delivery] WITH (NOLOCK)
          WHERE Dcdt >= @from AND Dcdt <= @to
            AND (@org IS NULL OR Org_sh = @org)
        ) sub
        WHERE rn = 1
        ORDER BY Dcno DESC
      `;
    } else if (moduleKey === 'process_inward') {
      moduleTitle = 'Process Inward (PI-04)';
      q = `
        SELECT TOP 2500
          refno as inwId,
          CONVERT(varchar(10), Inwdt, 23) as inwDate,
          ISNULL(yname, '-') as millName,
          ISNULL(DCNo, '-') as dcNo,
          ISNULL(Lotno, '-') as lotNo,
          ISNULL(DesignNo, '-') as spNo,
          ISNULL(Fabric_Name, '-') as fabricName,
          ISNULL(TPCNO, 0) as pieces,
          ROUND(ISNULL(TMtr, 0), 2) as totalMtrs,
          ISNULL(Org_sh, 'DEPL') as org
        FROM (
          SELECT 
            refno,
            Inwdt,
            yname,
            DCNo,
            Lotno,
            DesignNo,
            Fabric_Name,
            TPCNO,
            TMtr,
            Org_sh,
            ROW_NUMBER() OVER (PARTITION BY refno, Lotno ORDER BY Sno ASC) as rn
          FROM [Cloth_Final_Inw] WITH (NOLOCK)
          WHERE Inw_type = 'Process Inward'
            AND Inwdt >= @from AND Inwdt <= @to
            AND (@org IS NULL OR Org_sh = @org)
        ) sub
        WHERE rn = 1
        ORDER BY refno DESC
      `;
    } else if (moduleKey === 'sales_delivery') {
      moduleTitle = 'Sales Delivery (SD-05)';
      q = `
        SELECT TOP 2500
          CAST(invno as varchar(50)) as invNo,
          CONVERT(varchar(10), INVDt, 23) as invDate,
          ISNULL(pnam, '-') as customerName,
          ISNULL(Designno, '-') as designNo,
          ISNULL(HSNCODE, '-') as fabricType,
          ROUND(ISNULL(ToMtr, 0), 2) as totalMtrs,
          ROUND(ISNULL(NetAmt, 0), 2) as totalAmount,
          ROUND(ISNULL(Taxvalue / NULLIF(ToMtr, 0), 0), 2) as rate,
          ISNULL(Org_sh, 'DEPL') as org
        FROM [Fab_Sales] WITH (NOLOCK)
        WHERE ISNULL(cancel, 0) = 0
          AND INVDt >= @from AND INVDt <= @to
          AND (@org IS NULL OR Org_sh = @org)
        ORDER BY INVDt DESC, invno DESC
      `;
    } else if (moduleKey === 'ibpo') {
      moduleTitle = 'IBPO Orders (IB-06)';
      q = `
        SELECT TOP 2500
          pono as orderNo,
          CONVERT(varchar(10), refdt, 23) as orderDate,
          ISNULL(ord_type, '-') as orderType,
          ISNULL(pnam, '-') as customerName,
          ISNULL(Qlty, '-') as qualitySort,
          ROUND(ISNULL(CAST(Order_Mtr as float), 0), 2) as orderMtrs,
          Rate as rate,
          ISNULL(Org_sh, 'DEPL') as org
        FROM [IBPO] WITH (NOLOCK)
        WHERE ord_type <> 'Management Order'
          AND refdt >= @from AND refdt <= @to
          AND (@org IS NULL OR Org_sh = @org)
        ORDER BY refdt DESC, pono DESC
      `;
    } else {
      moduleTitle = 'IMPO Orders (IM-07)';
      q = `
        SELECT TOP 2500
          pono as orderNo,
          CONVERT(varchar(10), refdt, 23) as orderDate,
          ISNULL(ord_type, '-') as orderType,
          ISNULL(pnam, '-') as customerName,
          ISNULL(Qlty, '-') as qualitySort,
          ROUND(ISNULL(CAST(Order_Mtr as float), 0), 2) as orderMtrs,
          Rate as rate,
          ISNULL(Org_sh, 'DEPL') as org
        FROM [IBPO] WITH (NOLOCK)
        WHERE ord_type = 'Management Order'
          AND refdt >= @from AND refdt <= @to
          AND (@org IS NULL OR Org_sh = @org)
        ORDER BY refdt DESC, pono DESC
      `;
    }

    validateReadOnlyQuery(q);
    const result = await request.query(q);

    let records: any[] = [];

    if (moduleKey === 'vendor_inward' || moduleKey === 'purchase_inward') {
      records = result.recordset.map((r: any) => ({
        docNo: String(r.inwId),
        date: r.inwDate,
        partyName: r.vendorName,
        qualitySort: r.spNo,
        lotNo: r.lotNo,
        dcNo: r.dcNo,
        dcDate: r.dcDate,
        org: r.org,
        pieces: r.pieces || 0,
        meters: r.totalMtrs || 0,
        remarks: r.fabricName,
        processType: r.inwType,
        status: 'Received',
      }));
    } else if (moduleKey === 'process_delivery') {
      records = result.recordset.map((r: any) => ({
        docNo: String(r.dcNo),
        date: r.dcDate,
        partyName: r.millName,
        qualitySort: r.spNo,
        lotNo: r.lotNo,
        dcNo: String(r.dcNo),
        dcDate: r.dcDate,
        org: r.org,
        pieces: r.pieces || 0,
        meters: r.totalMtrs || 0,
        remarks: r.fabricName,
        processType: r.processType,
        status: 'Dispatched',
      }));
    } else if (moduleKey === 'process_inward') {
      records = result.recordset.map((r: any) => ({
        docNo: String(r.inwId),
        date: r.inwDate,
        partyName: r.millName,
        qualitySort: r.spNo,
        lotNo: r.lotNo,
        dcNo: r.dcNo,
        org: r.org,
        pieces: r.pieces || 0,
        meters: r.totalMtrs || 0,
        remarks: r.fabricName,
        processType: 'Process Inward',
        status: 'Received',
      }));
    } else if (moduleKey === 'sales_delivery') {
      records = result.recordset.map((r: any) => ({
        docNo: String(r.invNo),
        date: r.invDate,
        partyName: r.customerName,
        qualitySort: r.designNo,
        org: r.org,
        pieces: 0,
        meters: r.totalMtrs || 0,
        ratePerMeter: r.rate,
        totalAmount: r.totalAmount,
        remarks: r.fabricType,
        status: 'Invoiced',
      }));
    } else {
      records = result.recordset.map((r: any) => ({
        docNo: String(r.orderNo),
        date: r.orderDate,
        partyName: r.customerName,
        qualitySort: r.qualitySort,
        org: r.org,
        pieces: 0,
        meters: r.orderMtrs || 0,
        ratePerMeter: r.rate,
        processType: r.orderType,
        status: 'Completed',
      }));
    }

    const totalMeters = records.reduce((s: number, r: any) => s + r.meters, 0);

    return {
      moduleKey,
      moduleTitle,
      selectedOrg: org,
      date,
      dateRange: { fromDate: from, toDate: to },
      totalRecords: records.length,
      totalMeters: Math.round(totalMeters),
      records,
    };
  } catch (err: any) {
    console.error(`Error querying drilldown for ${moduleKey}:`, err);
    throw new Error(`Database Drilldown Query Failed: ${err.message}`);
  }
}
