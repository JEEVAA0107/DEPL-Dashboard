'use client';

import React, { useState } from 'react';
import { KpiSummaryResponse, BusinessModuleKey } from '@/lib/types';
import { formatMeters, formatCount } from '@/lib/formatters';

interface KpiCardsProps {
  data: KpiSummaryResponse | null;
  onSelectModule: (moduleKey: BusinessModuleKey) => void;
  isLoading: boolean;
  viewMode?: 'executive' | 'all';
  onViewModeChange?: (mode: 'executive' | 'all') => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  data,
  onSelectModule,
  isLoading,
  viewMode: controlledViewMode,
  onViewModeChange
}) => {
  const [internalViewMode, setInternalViewMode] = useState<'executive' | 'all'>('all');
  const viewMode = controlledViewMode ?? internalViewMode;
  const setViewMode = onViewModeChange ?? setInternalViewMode;

  if (!data || isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200/80 animate-pulse p-4 flex flex-col justify-between shadow-2xs">
            <div className="h-4 bg-slate-200 rounded w-2/3"></div>
            <div className="h-7 bg-slate-200 rounded w-1/2"></div>
            <div className="h-3 bg-slate-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const { modules } = data;

  // Executive Rollups
  const inwardMtr = modules.vendorInward.quantityMeters + modules.purchaseInward.quantityMeters;
  const inwardDocs = modules.vendorInward.primaryMetricValue + modules.purchaseInward.primaryMetricValue;

  const processMtr = modules.processDelivery.quantityMeters + modules.processInward.quantityMeters;
  const processDocs = modules.processDelivery.primaryMetricValue + modules.processInward.primaryMetricValue;

  const salesMtr = modules.salesDelivery.quantityMeters;
  const salesDocs = modules.salesDelivery.primaryMetricValue;

  const ordersMtr = modules.ibpo.quantityMeters + modules.impo.quantityMeters;
  const ordersDocs = modules.ibpo.primaryMetricValue + modules.impo.primaryMetricValue;

  // 7 Module Items aligned with Palette
  const moduleList = [
    {
      key: modules.vendorInward.key,
      title: 'Vendor Inward',
      code: 'VI-01',
      category: 'Inward Fabric',
      docLabel: modules.vendorInward.primaryMetricLabel,
      docVal: modules.vendorInward.primaryMetricValue,
      meters: modules.vendorInward.quantityMeters,
      color: '#345C64', // Primary Teal
      borderColor: 'border-[#345C64]/30',
      tagBg: 'bg-[#DDF3F0] text-[#1F3F47]',
    },
    {
      key: modules.purchaseInward.key,
      title: 'Purchase Inward',
      code: 'PI-02',
      category: 'Inward Fabric',
      docLabel: modules.purchaseInward.primaryMetricLabel,
      docVal: modules.purchaseInward.primaryMetricValue,
      meters: modules.purchaseInward.quantityMeters,
      color: '#2E9F92', // Chart Teal
      borderColor: 'border-[#2E9F92]/30',
      tagBg: 'bg-[#DDF3F0] text-[#1F3F47]',
    },
    {
      key: modules.processDelivery.key,
      title: 'Process Delivery',
      code: 'PD-03',
      category: 'Mill Processing',
      docLabel: modules.processDelivery.primaryMetricLabel,
      docVal: modules.processDelivery.primaryMetricValue,
      meters: modules.processDelivery.quantityMeters,
      color: '#1F3F47', // Deep Teal
      borderColor: 'border-[#1F3F47]/30',
      tagBg: 'bg-[#DDF3F0] text-[#1F3F47]',
    },
    {
      key: modules.processInward.key,
      title: 'Process Inward',
      code: 'PI-04',
      category: 'Mill Processing',
      docLabel: modules.processInward.primaryMetricLabel,
      docVal: modules.processInward.primaryMetricValue,
      meters: modules.processInward.quantityMeters,
      color: '#2E9F92', // Chart Teal
      borderColor: 'border-[#2E9F92]/30',
      tagBg: 'bg-[#DDF3F0] text-[#1F3F47]',
    },
    {
      key: modules.salesDelivery.key,
      title: 'Sales Delivery',
      code: 'SD-05',
      category: 'Sales & Dispatches',
      docLabel: modules.salesDelivery.primaryMetricLabel,
      docVal: modules.salesDelivery.primaryMetricValue,
      meters: modules.salesDelivery.quantityMeters,
      color: '#1F3F47', // Deep Teal
      borderColor: 'border-[#1F3F47]/30',
      tagBg: 'bg-[#DDF3F0] text-[#1F3F47]',
    },
    {
      key: modules.ibpo.key,
      title: 'IBPO Orders',
      code: 'IB-06',
      category: 'Customer Orders',
      docLabel: modules.ibpo.primaryMetricLabel,
      docVal: modules.ibpo.primaryMetricValue,
      meters: modules.ibpo.quantityMeters,
      color: '#345C64', // Primary Teal
      borderColor: 'border-[#345C64]/30',
      tagBg: 'bg-[#DDF3F0] text-[#1F3F47]',
    },
    {
      key: modules.impo.key,
      title: 'IMPO Orders',
      code: 'IM-07',
      category: 'Customer Orders',
      docLabel: modules.impo.primaryMetricLabel,
      docVal: modules.impo.primaryMetricValue,
      meters: modules.impo.quantityMeters,
      color: '#E96F50', // Coral Orange
      borderColor: 'border-[#E96F50]/30',
      tagBg: 'bg-[#E96F50]/15 text-[#E96F50]',
    },
  ];

  return (
    <div className="w-full mb-5">

      {/* ========================================================== */}
      {/* MODE 1: EXECUTIVE 4-POINT CARDS (ULTRA CLEAN & ATTRACTIVE) */}
      {/* ========================================================== */}
      {viewMode === 'executive' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Card 1: Total Fabric Inward */}
          <div
            onClick={() => onSelectModule('vendor_inward')}
            className="group bg-white hover:bg-[#DDF3F0]/20 rounded-2xl border border-slate-200/90 hover:border-[#345C64]/60 p-4 shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#345C64]"></div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-[#345C64] uppercase tracking-wider">
                  Fabric Inward Intake
                </span>
                <span className="text-xs font-bold text-[#1F3F47] bg-[#DDF3F0] border border-[#2E9F92]/30 px-2.5 py-0.5 rounded-md font-mono">
                  {formatCount(inwardDocs)} DCs
                </span>
              </div>
              <div className="text-2xl md:text-3xl font-black text-[#252B2E] font-mono tracking-tight group-hover:text-[#345C64] transition-colors">
                {formatMeters(inwardMtr, true)}
              </div>
            </div>

            {/* Sub-breakdown */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-[#252B2E]/70">
              <div className="flex items-center gap-2">
                <span title="Vendor Inward">VI: <strong className="text-[#252B2E] font-mono">{formatMeters(modules.vendorInward.quantityMeters)}</strong></span>
                <span className="text-slate-300">•</span>
                <span title="Purchase Inward">PI: <strong className="text-[#252B2E] font-mono">{formatMeters(modules.purchaseInward.quantityMeters)}</strong></span>
              </div>
              <span className="text-[#345C64] font-bold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                <span>Ledger</span>
                <span>→</span>
              </span>
            </div>
          </div>

          {/* Card 2: Mill Processing Flow */}
          <div
            onClick={() => onSelectModule('process_delivery')}
            className="group bg-white hover:bg-[#DDF3F0]/20 rounded-2xl border border-slate-200/90 hover:border-[#2E9F92]/60 p-4 shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#2E9F92]"></div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-[#2E9F92] uppercase tracking-wider">
                  Mill Processing Flow
                </span>
                <span className="text-xs font-bold text-[#1F3F47] bg-[#DDF3F0] border border-[#2E9F92]/30 px-2.5 py-0.5 rounded-md font-mono">
                  {formatCount(processDocs)} DCs
                </span>
              </div>
              <div className="text-2xl md:text-3xl font-black text-[#252B2E] font-mono tracking-tight group-hover:text-[#2E9F92] transition-colors">
                {formatMeters(processMtr, true)}
              </div>
            </div>

            {/* Sub-breakdown */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-[#252B2E]/70">
              <div className="flex items-center gap-2">
                <span title="Process Delivery">Sent: <strong className="text-[#252B2E] font-mono">{formatMeters(modules.processDelivery.quantityMeters)}</strong></span>
                <span className="text-slate-300">•</span>
                <span title="Process Inward">Recv: <strong className="text-[#252B2E] font-mono">{formatMeters(modules.processInward.quantityMeters)}</strong></span>
              </div>
              <span className="text-[#2E9F92] font-bold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                <span>Ledger</span>
                <span>→</span>
              </span>
            </div>
          </div>

          {/* Card 3: Sales Delivery Dispatches */}
          <div
            onClick={() => onSelectModule('sales_delivery')}
            className="group bg-white hover:bg-[#DDF3F0]/20 rounded-2xl border border-slate-200/90 hover:border-[#1F3F47]/60 p-4 shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#1F3F47]"></div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-[#1F3F47] uppercase tracking-wider">
                  Sales Dispatches (SD-05)
                </span>
                <span className="text-xs font-bold text-[#1F3F47] bg-[#DDF3F0] border border-[#2E9F92]/30 px-2.5 py-0.5 rounded-md font-mono">
                  {formatCount(salesDocs)} Invoices
                </span>
              </div>
              <div className="text-2xl md:text-3xl font-black text-[#252B2E] font-mono tracking-tight group-hover:text-[#1F3F47] transition-colors">
                {formatMeters(salesMtr, true)}
              </div>
            </div>

            {/* Sub-breakdown */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-[#252B2E]/70">
              <div className="flex items-center gap-2">
                <span>Revenue: <strong className="text-[#2E9F92] font-mono font-bold">{modules.salesDelivery.revenueAmount ? `₹${(modules.salesDelivery.revenueAmount / 100000).toFixed(1)} L` : 'Recorded'}</strong></span>
              </div>
              <span className="text-[#1F3F47] font-bold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                <span>Ledger</span>
                <span>→</span>
              </span>
            </div>
          </div>

          {/* Card 4: Customer Order Book */}
          <div
            onClick={() => onSelectModule('ibpo')}
            className="group bg-white hover:bg-[#E96F50]/10 rounded-2xl border border-slate-200/90 hover:border-[#E96F50]/60 p-4 shadow-xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#E96F50]"></div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold text-[#E96F50] uppercase tracking-wider">
                  Customer Orders Booked
                </span>
                <span className="text-xs font-bold text-[#E96F50] bg-[#E96F50]/15 border border-[#E96F50]/30 px-2.5 py-0.5 rounded-md font-mono">
                  {formatCount(ordersDocs)} Orders
                </span>
              </div>
              <div className="text-2xl md:text-3xl font-black text-[#252B2E] font-mono tracking-tight group-hover:text-[#E96F50] transition-colors">
                {formatMeters(ordersMtr, true)}
              </div>
            </div>

            {/* Sub-breakdown */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-[#252B2E]/70">
              <div className="flex items-center gap-2">
                <span title="IBPO Orders">IBPO: <strong className="text-[#252B2E] font-mono">{formatMeters(modules.ibpo.quantityMeters)}</strong></span>
                <span className="text-slate-300">•</span>
                <span title="IMPO Orders">IMPO: <strong className="text-[#252B2E] font-mono">{formatMeters(modules.impo.quantityMeters)}</strong></span>
              </div>
              <span className="text-[#E96F50] font-bold group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                <span>Ledger</span>
                <span>→</span>
              </span>
            </div>
          </div>

        </div>
      ) : (
        /* ========================================================== */
        /* MODE 2: 7 MODULES GRID (HIGHLIGHTED WORDS & LARGER FONTS)  */
        /* ========================================================== */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
          {moduleList.map((m) => (
            <div
              key={m.key}
              onClick={() => onSelectModule(m.key)}
              className="bg-white hover:bg-[#DDF3F0]/25 rounded-2xl border border-slate-200/90 hover:border-[#345C64] p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Top Accent Color Stripe */}
              <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: m.color }}></div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md font-mono shadow-2xs ${m.tagBg}`}>
                    {m.code}
                  </span>
                  <span className="text-[11px] font-bold text-[#1F3F47] bg-[#DDF3F0] border border-[#2E9F92]/30 px-2 py-0.5 rounded-md font-mono">
                    {formatCount(m.docVal)} {m.docLabel.replace('Total ', '')}
                  </span>
                </div>
                <h3 className="text-sm md:text-[14px] font-extrabold text-[#252B2E] group-hover:text-[#1F3F47] transition-colors leading-tight">
                  {m.title}
                </h3>
                <span className="text-[10px] font-bold text-[#345C64] uppercase tracking-wider block mt-0.5">
                  {m.category}
                </span>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-baseline justify-between">
                <div>
                  <div className="text-xl md:text-2xl font-black text-[#252B2E] font-mono tracking-tight group-hover:text-[#1F3F47] transition-colors">
                    {formatMeters(m.meters)}
                  </div>
                  <span className="text-[11px] font-bold text-[#345C64] uppercase tracking-wider">Meters</span>
                </div>
                <span className="text-xs font-bold text-[#345C64] group-hover:translate-x-0.5 transition-transform opacity-70 group-hover:opacity-100">
                  →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
