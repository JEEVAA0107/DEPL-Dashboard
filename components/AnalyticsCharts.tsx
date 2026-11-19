'use client';

import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { ChartsDataResponse, BusinessModuleKey } from '@/lib/types';
import { formatMeters, formatCount } from '@/lib/formatters';

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsChartsProps {
  data: ChartsDataResponse | null;
  onChartClick: (moduleKey: BusinessModuleKey, date?: string) => void;
  isLoading: boolean;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  data,
  onChartClick,
  isLoading
}) => {
  const [chartMode, setChartMode] = useState<'sales' | 'processes' | 'monthly' | 'mills'>('sales');

  const {
    dailyInwardComparison = [],
    processDeliveryVsInward = [],
    productionStages = [],
    salesTrend = [],
    monthlyPerformance = [],
    topProcessTypes = [],
    topMills = []
  } = data || {};

  // 1. Sales Trend data calculation directly from real ERP daily records
  const salesSlice = useMemo(() => salesTrend.slice(-15), [salesTrend]);
  const salesLabels = useMemo(() => salesSlice.map(p => {
    const parts = p.date.split('-');
    if (parts.length === 3) {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${parts[2]} ${months[parseInt(parts[1], 10) - 1]}`;
    }
    return p.date;
  }), [salesSlice]);

  const totalSalesMeters = useMemo(
    () => salesSlice.reduce((sum, p) => sum + p.salesMtr, 0),
    [salesSlice]
  );
  const peakSalesMeters = useMemo(
    () => Math.max(...salesSlice.map(p => p.salesMtr), 0),
    [salesSlice]
  );
  const avgSalesMeters = useMemo(
    () => (salesSlice.length ? Math.round(totalSalesMeters / salesSlice.length) : 0),
    [totalSalesMeters, salesSlice]
  );

  // Chart 1: Real Daily Sales Dispatch Velocity (Gradient Line)
  const salesAreaChartData = {
    labels: salesLabels,
    datasets: [
      {
        label: 'Sales Dispatched (Mtr)',
        data: salesSlice.map(p => p.salesMtr),
        borderColor: '#2E9F92',
        backgroundColor: (context: any) => {
          const ctx = context.chart?.ctx;
          if (!ctx) return 'rgba(46, 159, 146, 0.1)';
          const gradient = ctx.createLinearGradient(0, 0, 0, 260);
          gradient.addColorStop(0, 'rgba(46, 159, 146, 0.30)');
          gradient.addColorStop(1, 'rgba(46, 159, 146, 0.01)');
          return gradient;
        },
        borderWidth: 2.5,
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#2E9F92',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
      }
    ]
  };

  const salesAreaChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1F3F47',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => ` Dispatched: ${formatMeters(context.raw, true)}`
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10, weight: '500' }, color: '#252B2E' } },
      y: {
        grid: { color: '#F7FAFA' },
        ticks: { font: { size: 10 }, color: '#252B2E', callback: (value: any) => `${Math.round(value / 1000)}k` }
      }
    },
    onClick: (_: any, elements: any[]) => {
      if (elements.length > 0) {
        const idx = elements[0].index;
        const targetDate = salesSlice[idx]?.date;
        onChartClick('sales_delivery', targetDate);
      }
    }
  };

  // Chart 2: Real Mill Process Types Breakdown (Cloth_Delivery)
  const processBarData = {
    labels: topProcessTypes.map(p => p.processType),
    datasets: [
      {
        label: 'Meters Delivered',
        data: topProcessTypes.map(p => p.meters),
        backgroundColor: '#345C64',
        borderRadius: 4,
        barPercentage: 0.6,
      }
    ]
  };

  // Chart 3: Real Historical Monthly Sales & Revenue (Fab_Sales)
  const monthlyBarData = {
    labels: monthlyPerformance.map(m => `${m.month} '${String(m.year).slice(2)}`),
    datasets: [
      {
        label: 'Dispatched Meters',
        data: monthlyPerformance.map(m => m.salesMtr),
        backgroundColor: '#2E9F92',
        borderRadius: 4,
        barPercentage: 0.6,
      }
    ]
  };

  // Chart 4: Real Top Processing Mills (Cloth_Delivery)
  const millBarData = {
    labels: topMills.map(m => m.millName.length > 20 ? m.millName.slice(0, 18) + '...' : m.millName),
    datasets: [
      {
        label: 'Meters to Mill',
        data: topMills.map(m => m.meters),
        backgroundColor: '#345C64',
        borderRadius: 4,
        barPercentage: 0.6,
      }
    ]
  };

  const genericBarOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1F3F47',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => ` ${ctx.dataset.label}: ${formatMeters(ctx.raw, true)}`
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 9 }, color: '#252B2E' } },
      y: {
        grid: { color: '#F7FAFA' },
        ticks: { font: { size: 10 }, color: '#252B2E', callback: (v: any) => `${Math.round(v / 1000)}k` }
      }
    }
  };

  // Real Volume Distribution Donut (Calculated strictly from real totals)
  const totalInwardVol = dailyInwardComparison.reduce((s, p) => s + p.vendorInwardMtr + p.purchaseInwardMtr, 0);
  const totalProcVol = processDeliveryVsInward.reduce((s, p) => s + p.processDeliveryMtr + p.processInwardMtr, 0);
  const totalSalesVol = totalSalesMeters;
  const totalGrand = totalInwardVol + totalProcVol + totalSalesVol || 1;

  const inwardShare = Math.round((totalInwardVol / totalGrand) * 100);
  const procShare = Math.round((totalProcVol / totalGrand) * 100);
  const salesShare = 100 - inwardShare - procShare;

  const distributionDonutData = {
    labels: ['Fabric Inward', 'Mill Processing', 'Sales Dispatches'],
    datasets: [
      {
        data: [totalInwardVol, totalProcVol, totalSalesVol],
        backgroundColor: ['#345C64', '#2E9F92', '#E96F50'],
        hoverBackgroundColor: ['#1F3F47', '#258378', '#d65f41'],
        borderWidth: 2,
        borderColor: '#FFFFFF',
      }
    ]
  };

  const distributionDonutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '74%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1F3F47',
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => ` ${ctx.label}: ${formatMeters(ctx.raw, true)}`
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5">
        <div className="lg:col-span-8 h-72 bg-white rounded-2xl border border-slate-200 animate-pulse"></div>
        <div className="lg:col-span-4 h-72 bg-white rounded-2xl border border-slate-200 animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="mb-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* ======================================================== */}
        {/* CHART 1: PRIMARY EXECUTIVE TREND (8 COLS)                */}
        {/* ======================================================== */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
          
          {/* Header with Switcher Tabs */}
          <div className="pb-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2E9F92]"></span>
                <h3 className="text-sm font-bold text-[#252B2E]">
                  {chartMode === 'sales' && 'Sales Dispatch Velocity (Daily Trend)'}
                  {chartMode === 'processes' && 'Mill Processing Breakdown (Process-Wise)'}
                  {chartMode === 'monthly' && 'Monthly Historical Performance (Last 6 Months)'}
                  {chartMode === 'mills' && 'Top Processing Mill Partners'}
                </h3>
              </div>
              <p className="text-xs text-[#252B2E]/60 mt-0.5">
                {chartMode === 'sales' && 'Daily textile dispatches from Fab_Sales (click point for ledger)'}
                {chartMode === 'processes' && 'Meters delivered per process type from Cloth_Delivery'}
                {chartMode === 'monthly' && 'Real historical dispatch volume from Fab_Sales'}
                {chartMode === 'mills' && 'Top processing mills by volume delivered from Cloth_Delivery'}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center bg-[#F7FAFA] p-1 rounded-xl border border-slate-200/80 text-xs gap-1">
              <button
                onClick={() => setChartMode('sales')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  chartMode === 'sales'
                    ? 'bg-[#1F3F47] text-white shadow-xs font-bold'
                    : 'text-[#252B2E]/70 hover:text-[#252B2E] hover:bg-[#DDF3F0]'
                }`}
              >
                Daily Sales
              </button>
              <button
                onClick={() => setChartMode('processes')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  chartMode === 'processes'
                    ? 'bg-[#1F3F47] text-white shadow-xs font-bold'
                    : 'text-[#252B2E]/70 hover:text-[#252B2E] hover:bg-[#DDF3F0]'
                }`}
              >
                Mill Processes
              </button>
              <button
                onClick={() => setChartMode('mills')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  chartMode === 'mills'
                    ? 'bg-[#1F3F47] text-white shadow-xs font-bold'
                    : 'text-[#252B2E]/70 hover:text-[#252B2E] hover:bg-[#DDF3F0]'
                }`}
              >
                Top Mills
              </button>
              <button
                onClick={() => setChartMode('monthly')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  chartMode === 'monthly'
                    ? 'bg-[#1F3F47] text-white shadow-xs font-bold'
                    : 'text-[#252B2E]/70 hover:text-[#252B2E] hover:bg-[#DDF3F0]'
                }`}
              >
                Monthly History
              </button>
            </div>
          </div>

          {/* Key Stat Strip */}
          <div className="grid grid-cols-3 gap-3 my-3">
            <div className="bg-[#F7FAFA] border border-slate-200/70 rounded-xl px-3 py-2 text-center">
              <span className="text-[10px] uppercase font-bold text-[#252B2E]/60 block">Peak Daily Run</span>
              <span className="text-sm font-extrabold font-mono text-[#345C64]">{formatMeters(peakSalesMeters)}</span>
            </div>
            <div className="bg-[#F7FAFA] border border-slate-200/70 rounded-xl px-3 py-2 text-center">
              <span className="text-[10px] uppercase font-bold text-[#252B2E]/60 block">Daily Average</span>
              <span className="text-sm font-extrabold font-mono text-[#2E9F92]">{formatMeters(avgSalesMeters)}</span>
            </div>
            <div className="bg-[#DDF3F0] border border-[#2E9F92]/40 rounded-xl px-3 py-2 text-center">
              <span className="text-[10px] uppercase font-bold text-[#1F3F47] block">Total Dispatches</span>
              <span className="text-sm font-extrabold font-mono text-[#1F3F47]">{formatMeters(totalSalesMeters, true)}</span>
            </div>
          </div>

          {/* Interactive Chart Canvas */}
          <div className="h-56 w-full relative">
            {chartMode === 'sales' && <Line data={salesAreaChartData} options={salesAreaChartOptions} />}
            {chartMode === 'processes' && <Bar data={processBarData} options={genericBarOptions} />}
            {chartMode === 'mills' && <Bar data={millBarData} options={genericBarOptions} />}
            {chartMode === 'monthly' && <Bar data={monthlyBarData} options={genericBarOptions} />}
          </div>

        </div>

        {/* ======================================================== */}
        {/* CHART 2: CLEAN VOLUME DISTRIBUTION DONUT (4 COLS)        */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between">
          
          <div className="pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#345C64]"></span>
              <h3 className="text-sm font-bold text-[#252B2E]">
                Textile Volume Distribution
              </h3>
            </div>
            <p className="text-xs text-[#252B2E]/60 mt-0.5">
              Live proportion across operational stages
            </p>
          </div>

          {/* Donut with Central Total */}
          <div className="h-44 w-full relative my-2 flex items-center justify-center">
            <Doughnut data={distributionDonutData} options={distributionDonutOptions} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] uppercase font-bold text-[#252B2E]/60 tracking-wider">Total Volume</span>
              <span className="text-base font-black font-mono text-[#1F3F47]">
                {Math.round(totalGrand / 100000) / 10} L Mtr
              </span>
            </div>
          </div>

          {/* Clean Legend & Stats */}
          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#252B2E]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#345C64]"></span>
                Fabric Inward
              </span>
              <span className="font-bold text-[#252B2E] font-mono">
                {inwardShare}% <span className="text-[11px] font-normal text-[#252B2E]/60">({formatMeters(totalInwardVol)})</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#252B2E]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2E9F92]"></span>
                Mill Processing
              </span>
              <span className="font-bold text-[#252B2E] font-mono">
                {procShare}% <span className="text-[11px] font-normal text-[#252B2E]/60">({formatMeters(totalProcVol)})</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[#252B2E]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E96F50]"></span>
                Sales Dispatches
              </span>
              <span className="font-bold text-[#252B2E] font-mono">
                {salesShare}% <span className="text-[11px] font-normal text-[#252B2E]/60">({formatMeters(totalSalesVol)})</span>
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
