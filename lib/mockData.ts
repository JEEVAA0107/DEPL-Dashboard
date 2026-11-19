import { 
  DailyTransactionSummaryRow, 
  KpiSummaryResponse, 
  ChartsDataResponse, 
  DrilldownResponse, 
  BusinessModuleKey,
  DrilldownRecord,
  MonthlyPerformancePoint
} from './types';

// Palette definitions matching enterprise ERP guidelines
export const ERP_THEME = {
  primaryNavy: '#243746',
  darkSlate: '#34495E',
  professionalTeal: '#167C80',
  mutedGreen: '#47865A',
  industrialBlue: '#34789A',
  warmGrey: '#F2F3F3',
  white: '#FFFFFF',
  darkText: '#263238',
  borderGrey: '#D5D9DC',
  // Coordinated solid badge/card colors
  modules: {
    vendor_inward: { bg: '#243746', text: '#FFFFFF', border: '#1a2732', badge: 'VI-01' },
    purchase_inward: { bg: '#34789A', text: '#FFFFFF', border: '#2b6380', badge: 'PI-02' },
    process_delivery: { bg: '#167C80', text: '#FFFFFF', border: '#126164', badge: 'PD-03' },
    process_inward: { bg: '#47865A', text: '#FFFFFF', border: '#396d49', badge: 'PI-04' },
    sales_delivery: { bg: '#B3541E', text: '#FFFFFF', border: '#944416', badge: 'SD-05' },
    ibpo: { bg: '#5D4037', text: '#FFFFFF', border: '#48322b', badge: 'IB-06' },
    impo: { bg: '#4A5568', text: '#FFFFFF', border: '#373f4e', badge: 'IM-07' },
  }
};

// Generate realistic daily textile transactions for the past 30 days
export function generateDailyRecords(daysCount = 30): DailyTransactionSummaryRow[] {
  const records: DailyTransactionSummaryRow[] = [];
  const baseDate = new Date();

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // Seeded pseudo-random variations based on day index
    const dayFactor = 1 + (Math.sin(i * 0.7) * 0.25);
    const isWeekend = d.getDay() === 0;

    const multiplier = isWeekend ? 0.35 : 1.0;

    const vendorInwardDc = Math.round((14 + (i % 7)) * multiplier);
    const vendorInwardMtr = Math.round((18500 + (i * 450) % 6200) * dayFactor * multiplier);

    const purchaseInwardDc = Math.round((10 + (i % 5)) * multiplier);
    const purchaseInwardMtr = Math.round((14200 + (i * 320) % 5100) * dayFactor * multiplier);

    const processDeliveryDc = Math.round((18 + (i % 9)) * multiplier);
    const processDeliveryMtr = Math.round((24500 + (i * 610) % 7800) * dayFactor * multiplier);

    const processInwardDc = Math.round((16 + (i % 8)) * multiplier);
    const processInwardMtr = Math.round((22800 + (i * 540) % 7100) * dayFactor * multiplier);

    const salesInvoice = Math.round((22 + (i % 11)) * multiplier);
    const salesMtr = Math.round((31200 + (i * 720) % 9400) * dayFactor * multiplier);

    const ibpoOrders = Math.round((6 + (i % 4)) * multiplier);
    const ibpoMtr = Math.round((9500 + (i * 280) % 3600) * dayFactor * multiplier);

    const impoOrders = Math.round((4 + (i % 3)) * multiplier);
    const impoMtr = Math.round((7800 + (i * 210) % 3100) * dayFactor * multiplier);

    records.push({
      id: `TRX-${dateStr}`,
      date: dateStr,
      vendorInwardDc,
      vendorInwardMtr,
      purchaseInwardDc,
      purchaseInwardMtr,
      processDeliveryDc,
      processDeliveryMtr,
      processInwardDc,
      processInwardMtr,
      salesInvoice,
      salesMtr,
      ibpoOrders,
      ibpoMtr,
      impoOrders,
      impoMtr
    });
  }

  return records;
}

export const INITIAL_DAILY_DATA: DailyTransactionSummaryRow[] = generateDailyRecords(30);

// Filter records by date range
export function filterRecordsByDate(
  records: DailyTransactionSummaryRow[], 
  fromDate?: string, 
  toDate?: string
): DailyTransactionSummaryRow[] {
  return records.filter(row => {
    if (fromDate && row.date < fromDate) return false;
    if (toDate && row.date > toDate) return false;
    return true;
  });
}

// Compute aggregate KPIs for 7 business modules
export function computeKpiSummary(records: DailyTransactionSummaryRow[]): KpiSummaryResponse {
  let viDc = 0, viMtr = 0;
  let piDc = 0, piMtr = 0;
  let pdDc = 0, pdMtr = 0;
  let procInDc = 0, procInMtr = 0;
  let sdInv = 0, sdMtr = 0;
  let ibpoOrd = 0, ibpoMtr = 0;
  let impoOrd = 0, impoMtr = 0;

  for (const r of records) {
    viDc += r.vendorInwardDc;
    viMtr += r.vendorInwardMtr;
    piDc += r.purchaseInwardDc;
    piMtr += r.purchaseInwardMtr;
    pdDc += r.processDeliveryDc;
    pdMtr += r.processDeliveryMtr;
    procInDc += r.processInwardDc;
    procInMtr += r.processInwardMtr;
    sdInv += r.salesInvoice;
    sdMtr += r.salesMtr;
    ibpoOrd += r.ibpoOrders;
    ibpoMtr += r.ibpoMtr;
    impoOrd += r.impoOrders;
    impoMtr += r.impoMtr;
  }

  const grandTotalMeters = viMtr + piMtr + pdMtr + procInMtr + sdMtr + ibpoMtr + impoMtr;
  const grandTotalDocs = viDc + piDc + pdDc + procInDc + sdInv + ibpoOrd + impoOrd;

  const minDate = records.length > 0 ? records[records.length - 1].date : '';
  const maxDate = records.length > 0 ? records[0].date : '';

  return {
    dateRange: {
      fromDate: minDate,
      toDate: maxDate,
    },
    lastRefreshed: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
    grandTotalMeters,
    grandTotalDocs,
    modules: {
      vendorInward: {
        key: 'vendor_inward',
        title: 'Vendor Inward',
        code: 'VI-01',
        primaryMetricLabel: 'Total DC',
        primaryMetricValue: viDc,
        quantityMeters: viMtr,
        color: ERP_THEME.modules.vendor_inward.bg,
        accentColor: ERP_THEME.modules.vendor_inward.border,
        badge: 'Inward DC',
        icon: 'Truck'
      },
      purchaseInward: {
        key: 'purchase_inward',
        title: 'Purchase Inward',
        code: 'PI-02',
        primaryMetricLabel: 'Total DC',
        primaryMetricValue: piDc,
        quantityMeters: piMtr,
        color: ERP_THEME.modules.purchase_inward.bg,
        accentColor: ERP_THEME.modules.purchase_inward.border,
        badge: 'Raw Fabric',
        icon: 'PackageCheck'
      },
      processDelivery: {
        key: 'process_delivery',
        title: 'Process Delivery',
        code: 'PD-03',
        primaryMetricLabel: 'Total DC',
        primaryMetricValue: pdDc,
        quantityMeters: pdMtr,
        color: ERP_THEME.modules.process_delivery.bg,
        accentColor: ERP_THEME.modules.process_delivery.border,
        badge: 'To Mill',
        icon: 'ArrowRightCircle'
      },
      processInward: {
        key: 'process_inward',
        title: 'Process Inward',
        code: 'PI-04',
        primaryMetricLabel: 'Total DC',
        primaryMetricValue: procInDc,
        quantityMeters: procInMtr,
        color: ERP_THEME.modules.process_inward.bg,
        accentColor: ERP_THEME.modules.process_inward.border,
        badge: 'Finished Stock',
        icon: 'ArrowDownCircle'
      },
      salesDelivery: {
        key: 'sales_delivery',
        title: 'Sales Delivery',
        code: 'SD-05',
        primaryMetricLabel: 'Total Invoice',
        primaryMetricValue: sdInv,
        quantityMeters: sdMtr,
        color: ERP_THEME.modules.sales_delivery.bg,
        accentColor: ERP_THEME.modules.sales_delivery.border,
        badge: 'Dispatched',
        icon: 'BadgePercent'
      },
      ibpo: {
        key: 'ibpo',
        title: 'IBPO',
        code: 'IB-06',
        primaryMetricLabel: 'Total Orders',
        primaryMetricValue: ibpoOrd,
        quantityMeters: ibpoMtr,
        color: ERP_THEME.modules.ibpo.bg,
        accentColor: ERP_THEME.modules.ibpo.border,
        badge: 'Branch PO',
        icon: 'FileText'
      },
      impo: {
        key: 'impo',
        title: 'IMPO',
        code: 'IM-07',
        primaryMetricLabel: 'Total Orders',
        primaryMetricValue: impoOrd,
        quantityMeters: impoMtr,
        color: ERP_THEME.modules.impo.bg,
        accentColor: ERP_THEME.modules.impo.border,
        badge: 'Mill PO',
        icon: 'FileSpreadsheet'
      }
    }
  };
}

// Compute charts data
export function computeChartsData(records: DailyTransactionSummaryRow[]): ChartsDataResponse {
  // Sort oldest to newest for chronological charts
  const chronological = [...records].reverse();

  // 1. Daily Vendor Inward vs Purchase Inward
  const dailyInwardComparison = chronological.map(r => ({
    date: r.date.slice(5), // MM-DD
    vendorInwardMtr: r.vendorInwardMtr,
    purchaseInwardMtr: r.purchaseInwardMtr,
  }));

  // 2. Process Delivery vs Process Inward
  const processDeliveryVsInward = chronological.map(r => ({
    date: r.date.slice(5),
    processDeliveryMtr: r.processDeliveryMtr,
    processInwardMtr: r.processInwardMtr,
  }));

  // 3. Production vs Checking vs Grey Delivery (Total stages)
  const totalProcessInward = records.reduce((sum, r) => sum + r.processInwardMtr, 0);
  const totalPurchase = records.reduce((sum, r) => sum + r.purchaseInwardMtr, 0);
  const totalProcessDelivery = records.reduce((sum, r) => sum + r.processDeliveryMtr, 0);

  const stageSum = totalProcessInward + totalPurchase + totalProcessDelivery || 1;

  const productionStages = [
    {
      stage: 'Grey Delivery',
      meters: totalPurchase,
      percentage: Number(((totalPurchase / stageSum) * 100).toFixed(1)),
      color: '#34789A'
    },
    {
      stage: 'Checking & Inspection',
      meters: Math.round(totalProcessDelivery * 0.96),
      percentage: Number((((totalProcessDelivery * 0.96) / stageSum) * 100).toFixed(1)),
      color: '#167C80'
    },
    {
      stage: 'Finished Production',
      meters: totalProcessInward,
      percentage: Number(((totalProcessInward / stageSum) * 100).toFixed(1)),
      color: '#47865A'
    }
  ];

  // 4. Daily Sales Quantity Trend with 5-day moving average
  const salesTrend = chronological.map((r, idx, arr) => {
    const startIdx = Math.max(0, idx - 4);
    const slice = arr.slice(startIdx, idx + 1);
    const avg = slice.reduce((acc, curr) => acc + curr.salesMtr, 0) / slice.length;

    return {
      date: r.date.slice(5),
      salesMtr: r.salesMtr,
      invoicesCount: r.salesInvoice,
      movingAverageMtr: Math.round(avg),
    };
  });

  // 5. Monthly Business Performance (Sample aggregated monthly summary)
  const monthlyPerformance: MonthlyPerformancePoint[] = [
    { month: 'Jun', year: 2026, salesMtr: 680000, invoices: 180, revenue: 45000000 },
    { month: 'Jul', year: 2026, salesMtr: 745000, invoices: 195, revenue: 51000000 },
    { month: 'Aug', year: 2026, salesMtr: 810000, invoices: 210, revenue: 58000000 },
    { month: 'Sep', year: 2026, salesMtr: 790000, invoices: 205, revenue: 56000000 },
    { month: 'Oct', year: 2026, salesMtr: 890000, invoices: 230, revenue: 64000000 },
    { month: 'Nov', year: 2026, salesMtr: 940000, invoices: 245, revenue: 69000000 },
  ];

  return {
    dailyInwardComparison,
    processDeliveryVsInward,
    productionStages,
    salesTrend,
    monthlyPerformance,
    topProcessTypes: [
      { processType: 'Dyeing & Bleaching', dcs: 450, meters: 540000 },
      { processType: 'Printing & Finishing', dcs: 320, meters: 380000 },
      { processType: 'Compact & Heatset', dcs: 210, meters: 260000 },
      { processType: 'Mercerizing', dcs: 155, meters: 180000 }
    ],
    topMills: [
      { millName: 'Senthil Process Mills', dcs: 310, meters: 410000 },
      { millName: 'Jayalakshmi Dyeing Ltd', dcs: 260, meters: 320000 },
      { millName: 'Sri Balaji Processors', dcs: 190, meters: 240000 },
      { millName: 'Vigneshwar Finishing', dcs: 145, meters: 190000 }
    ]
  };
}

// Detailed drill-down transaction mock generator for modal inspection
export function getDrilldownDetails(moduleKey: BusinessModuleKey, date?: string): DrilldownResponse {
  const parties: Record<BusinessModuleKey, string[]> = {
    vendor_inward: [
      'Sri Venkateswara Weaving Mills, Somanur',
      'Lakshmi Cotton Weaving, Palladam',
      'Surya Textiles Unit 2, Tirupur',
      'Senthil Velan Looms, Komarapalayam',
      'Arunachala Textiles, Erode'
    ],
    purchase_inward: [
      'Arvind Limited (Grey Div), Ahmedabad',
      'Loyal Textile Mills Ltd, Kovilpatti',
      'Premier Mills Private Ltd, Coimbatore',
      'Ramco Textiles Division, Rajapalayam',
      'Vardhman Polytex Ltd, Ludhiana'
    ],
    process_delivery: [
      'Apex Textile Processors, Perundurai SIPCOT',
      'Emerald Dyeing & Bleaching, Tirupur',
      'Kaveri Yarn Dyeing Mills, Erode',
      'Modern Mercerizing & Bleachers, Salem',
      'Super Quality Finishing Mills, SIPCOT'
    ],
    process_inward: [
      'Apex Textile Processors, Perundurai SIPCOT',
      'Emerald Dyeing & Bleaching, Tirupur',
      'Kaveri Yarn Dyeing Mills, Erode',
      'Modern Mercerizing & Bleachers, Salem',
      'Super Quality Finishing Mills, SIPCOT'
    ],
    sales_delivery: [
      'Shahi Exports Pvt Ltd, Bengaluru',
      'Gokaldas Exports Limited, Bengaluru',
      'Raymond Lifestyle Brands, Mumbai',
      'Aditya Birla Fashion & Retail, Tirupur Depot',
      'Reliance Retail Fabrics, Ahmedabad'
    ],
    ibpo: [
      'DEPL Branch - Surat Sales Depot',
      'DEPL Branch - Ahmedabad Central Hub',
      'DEPL Branch - Mumbai Kalbadevi',
      'DEPL Branch - Delhi Gandhi Nagar',
      'DEPL Branch - Ichalkaranji Depot'
    ],
    impo: [
      'Murugan Spinning Mills, Pallipalayam',
      'KPR Mill Limited, Arasur',
      'Best Corporation Ltd, Tirupur',
      'Super Spinning Mills Ltd, Hindupur',
      'Nahar Spinning Mills, Bhopal'
    ]
  };

  const sorts = [
    '40s Combed Cotton Poplin (63" Grey)',
    '60s x 60s Cambric 92x88 (58" Finished)',
    '2/40 Cotton Twill 108x56 (60" Bleached)',
    '30s Rayon Reactive Dyed (56" Soft Finish)',
    '80s Superfine Voile Printed (44" Cotton)',
    '20s x 20s Cotton Drill Heavy (62" Grey)',
    '100% Linen Plain Weave Natural Finish (54")'
  ];

  const prefixMap: Record<BusinessModuleKey, string> = {
    vendor_inward: 'VI-DC',
    purchase_inward: 'PI-DC',
    process_delivery: 'PD-DC',
    process_inward: 'PR-IN',
    sales_delivery: 'INV-26',
    ibpo: 'IBPO-26',
    impo: 'IMPO-26'
  };

  const moduleTitles: Record<BusinessModuleKey, string> = {
    vendor_inward: 'Vendor Inward Transactions',
    purchase_inward: 'Purchase Inward Transactions',
    process_delivery: 'Process Delivery Transactions',
    process_inward: 'Process Inward Transactions',
    sales_delivery: 'Sales Delivery Transactions',
    ibpo: 'Inter-Branch Purchase Orders (IBPO)',
    impo: 'Import / Mill Purchase Orders (IMPO)'
  };

  const selectedParties = parties[moduleKey] || parties.vendor_inward;
  const count = 15;
  const records: DrilldownRecord[] = [];
  let totalMeters = 0;

  const targetDate = date || new Date().toISOString().split('T')[0];

  for (let i = 1; i <= count; i++) {
    const party = selectedParties[(i - 1) % selectedParties.length];
    const sort = sorts[(i - 1) % sorts.length];
    const pieces = Math.floor(12 + (i * 3));
    const meters = Math.round(pieces * (85.5 + (i % 10) * 2.2));
    const rate = Math.round(65 + (i * 4.5));
    const totalAmount = meters * rate;
    totalMeters += meters;

    records.push({
      docNo: `${prefixMap[moduleKey]}-${1000 + i * 7}`,
      date: targetDate,
      partyName: party,
      qualitySort: sort,
      pieces,
      meters,
      ratePerMeter: rate,
      totalAmount,
      processType: moduleKey.includes('process') ? (i % 2 === 0 ? 'Dyeing & Soft Finish' : 'Bleaching & Mercerizing') : undefined,
      status: i % 5 === 0 ? 'Pending' : (moduleKey === 'sales_delivery' ? 'Invoiced' : 'Received'),
      remarks: `Lot #${202600 + i * 11} - Verified at Weighbridge & QA`
    });
  }

  return {
    moduleKey,
    moduleTitle: moduleTitles[moduleKey],
    date: targetDate,
    totalRecords: records.length,
    totalMeters,
    records
  };
}
