'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { DrilldownResponse, BusinessModuleKey } from '@/lib/types';
import { formatMeters, formatCount, formatErpDate } from '@/lib/formatters';

interface DrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: DrilldownResponse | null;
  isLoading: boolean;
}

export const DrilldownModal: React.FC<DrilldownModalProps> = ({
  isOpen,
  onClose,
  data,
  isLoading,
}) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    setCurrentPage(1);
    setSearch('');
  }, [data]);

  // Esc key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredRecords = useMemo(() => {
    if (!data || !data.records) return [];
    if (!search.trim()) return data.records;
    const q = search.toLowerCase().trim();
    return data.records.filter(r => 
      r.docNo.toLowerCase().includes(q) ||
      r.partyName.toLowerCase().includes(q) ||
      r.qualitySort.toLowerCase().includes(q) ||
      (r.org && r.org.toLowerCase().includes(q)) ||
      (r.lotNo && r.lotNo.toLowerCase().includes(q)) ||
      (r.dcNo && r.dcNo.toLowerCase().includes(q)) ||
      (r.processType && r.processType.toLowerCase().includes(q)) ||
      (r.remarks && r.remarks.toLowerCase().includes(q))
    );
  }, [data, search]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    if (pageSize === 0) return filteredRecords;
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const summary = useMemo(() => {
    let pieces = 0;
    let meters = 0;
    let amount = 0;
    for (const r of filteredRecords) {
      pieces += (r.pieces || 0);
      meters += (r.meters || 0);
      amount += (r.totalAmount || 0);
    }
    return { pieces, meters, amount };
  }, [filteredRecords]);

  if (!isOpen) return null;

  const exportModalToCsv = () => {
    if (!data) return;
    const moduleKey = data.moduleKey;
    let headers: string[] = [];
    let rows: string[] = [];

    if (moduleKey === 'vendor_inward' || moduleKey === 'purchase_inward') {
      headers = ['Org', 'Inw ID', 'Inw Date', 'Lot No', 'Inw Type', 'Vendor Name', 'DC No', 'DC Date', 'Total Mtrs', 'Pieces', 'SP No', 'Fabric Name'];
      rows = [headers.join(',')];
      filteredRecords.forEach(r => {
        rows.push([
          `"${r.org || 'DEPL'}"`,
          `"${r.docNo}"`,
          `"${r.date}"`,
          `"${r.lotNo || '-'}"`,
          `"${r.processType || '-'}"`,
          `"${r.partyName.replace(/"/g, '""')}"`,
          `"${r.dcNo || '-'}"`,
          `"${r.dcDate || '-'}"`,
          r.meters,
          r.pieces || 0,
          `"${r.qualitySort.replace(/"/g, '""')}"`,
          `"${(r.remarks || '').replace(/"/g, '""')}"`
        ].join(','));
      });
    } else if (moduleKey === 'process_delivery') {
      headers = ['Org', 'DC No', 'DC Date', 'Process Type', 'Mill Name', 'Lot No', 'Total Mtrs', 'Pieces', 'SP No', 'Fabric Name'];
      rows = [headers.join(',')];
      filteredRecords.forEach(r => {
        rows.push([
          `"${r.org || 'DEPL'}"`,
          `"${r.docNo}"`,
          `"${r.date}"`,
          `"${r.processType || '-'}"`,
          `"${r.partyName.replace(/"/g, '""')}"`,
          `"${r.lotNo || '-'}"`,
          r.meters,
          r.pieces || 0,
          `"${r.qualitySort.replace(/"/g, '""')}"`,
          `"${(r.remarks || '').replace(/"/g, '""')}"`
        ].join(','));
      });
    } else if (moduleKey === 'process_inward') {
      headers = ['Org', 'Inw ID', 'Inw Date', 'Mill Name', 'DC No', 'Lot No', 'Total Mtrs', 'Pieces', 'SP No', 'Fabric Name'];
      rows = [headers.join(',')];
      filteredRecords.forEach(r => {
        rows.push([
          `"${r.org || 'DEPL'}"`,
          `"${r.docNo}"`,
          `"${r.date}"`,
          `"${r.partyName.replace(/"/g, '""')}"`,
          `"${r.dcNo || '-'}"`,
          `"${r.lotNo || '-'}"`,
          r.meters,
          r.pieces || 0,
          `"${r.qualitySort.replace(/"/g, '""')}"`,
          `"${(r.remarks || '').replace(/"/g, '""')}"`
        ].join(','));
      });
    } else if (moduleKey === 'sales_delivery') {
      headers = ['Org', 'Invoice #', 'Invoice Date', 'Customer Name', 'Design / SP No', 'Fabric Type', 'Total Mtrs', 'Rate (₹)', 'Total Amount (₹)'];
      rows = [headers.join(',')];
      filteredRecords.forEach(r => {
        rows.push([
          `"${r.org || 'DEPL'}"`,
          `"${r.docNo}"`,
          `"${r.date}"`,
          `"${r.partyName.replace(/"/g, '""')}"`,
          `"${r.qualitySort.replace(/"/g, '""')}"`,
          `"${(r.remarks || '').replace(/"/g, '""')}"`,
          r.meters,
          r.ratePerMeter || 0,
          r.totalAmount || 0
        ].join(','));
      });
    } else {
      headers = ['Org', 'Order #', 'Order Date', 'Order Type', 'Customer Name', 'Quality Sort', 'Order Mtrs', 'Rate (₹)'];
      rows = [headers.join(',')];
      filteredRecords.forEach(r => {
        rows.push([
          `"${r.org || 'DEPL'}"`,
          `"${r.docNo}"`,
          `"${r.date}"`,
          `"${r.processType || '-'}"`,
          `"${r.partyName.replace(/"/g, '""')}"`,
          `"${r.qualitySort.replace(/"/g, '""')}"`,
          r.meters,
          r.ratePerMeter || 0
        ].join(','));
      });
    }

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${data.moduleKey}_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const moduleKey = data?.moduleKey;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 md:p-6 animate-fadeIn">
      <div 
        className="bg-white rounded-2xl border-t-4 border-[#345C64] border border-slate-300 shadow-2xl w-full max-w-[1700px] max-h-[94vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* 1. Modal Header - Unified Executive Deep Teal Palette */}
        <div className="bg-[#1F3F47] text-white px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#345C64]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#345C64] flex items-center justify-center font-bold text-white text-xs shadow-xs border border-white/20">
              ERP
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-sm md:text-base font-bold tracking-tight text-white uppercase">
                  {data?.moduleTitle || 'Transaction Register'}
                </h3>

                {/* Division Pill */}
                {data?.selectedOrg && (
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-md font-bold tracking-wide shadow-xs ${
                    data.selectedOrg === 'DEPL'
                      ? 'bg-[#DDF3F0] text-[#1F3F47] border border-[#2E9F92]/40'
                      : data.selectedOrg === 'MTM'
                      ? 'bg-[#E96F50] text-white'
                      : 'bg-[#345C64] text-white border border-white/20'
                  }`}>
                    {data.selectedOrg === 'DEPL' ? 'DEPL' : data.selectedOrg === 'MTM' ? 'MTM' : 'ALL'}
                  </span>
                )}

                {/* Date / Period Pill */}
                {data?.date ? (
                  <span className="text-[11px] bg-[#345C64]/60 text-white px-2.5 py-0.5 rounded-md font-mono border border-white/20 font-semibold">
                    Date: {formatErpDate(data.date)}
                  </span>
                ) : data?.dateRange ? (
                  <span className="text-[11px] bg-[#345C64]/60 text-white px-2.5 py-0.5 rounded-md font-mono border border-white/20 font-semibold">
                    Period: {formatErpDate(data.dateRange.fromDate)} to {formatErpDate(data.dateRange.toDate)}
                  </span>
                ) : null}
              </div>

              <p className="text-[11px] text-[#DDF3F0] mt-0.5 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2E9F92]"></span>
                <span>Live Database Records</span>
              </p>
            </div>
          </div>

          {/* Action Buttons: Export CSV & Close */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={exportModalToCsv}
              className="bg-[#2E9F92] hover:bg-[#258378] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
              title="Export ledger to CSV"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export CSV</span>
            </button>

            <button
              onClick={onClose}
              className="text-white hover:bg-[#27484e] bg-[#345C64] w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm transition-colors border border-white/20"
              title="Close modal (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 2. Sub-Header Toolbar - Clean Neutral Palette */}
        <div className="bg-[#F7FAFA] border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Search Input & View Toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <input
                type="text"
                placeholder="Search ID, Lot, DC, Party, SP No..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-300 rounded-xl pl-8 pr-7 py-1.5 text-xs text-[#252B2E] w-64 md:w-80 focus:outline-none focus:ring-2 focus:ring-[#345C64]/30 focus:border-[#345C64] shadow-2xs font-medium placeholder-slate-400"
              />
              <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {search && (
                <button 
                  onClick={() => setSearch('')} 
                  className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* View Mode Toggle (Table vs Cards for Mobile) */}
            <div className="flex items-center bg-white p-0.5 rounded-xl text-xs gap-0.5 shadow-2xs border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  viewMode === 'table' ? 'bg-[#1F3F47] text-white shadow-xs' : 'text-[#252B2E]/70 hover:text-[#252B2E] hover:bg-[#DDF3F0]'
                }`}
              >
                Table View
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  viewMode === 'cards' ? 'bg-[#1F3F47] text-white shadow-xs' : 'text-[#252B2E]/70 hover:text-[#252B2E] hover:bg-[#DDF3F0]'
                }`}
              >
                Card View
              </button>
            </div>
          </div>

          {/* Clean Metric Chips (Palette Aligned High-Contrast) */}
          <div className="flex items-center gap-3 sm:gap-4 text-xs font-medium flex-wrap">
            <div className="bg-white border border-slate-200/90 px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5">
              <span className="text-[#252B2E]/70 font-semibold">Records:</span>
              <strong className="font-mono font-extrabold text-[#252B2E]">{filteredRecords.length}</strong>
            </div>

            {summary.pieces > 0 && (
              <div className="bg-white border border-slate-200/90 px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5">
                <span className="text-[#252B2E]/70 font-semibold">Pieces:</span>
                <strong className="font-mono font-extrabold text-[#252B2E]">{formatCount(summary.pieces)}</strong>
              </div>
            )}

            <div className="bg-[#DDF3F0] border border-[#2E9F92]/50 px-3.5 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5">
              <span className="text-[#1F3F47] font-bold">Total Meters:</span>
              <strong className="font-mono font-black text-[#1F3F47]">{formatMeters(summary.meters, true)}</strong>
            </div>

            {summary.amount > 0 && (
              <div className="bg-[#DDF3F0] border border-[#2E9F92]/50 px-3.5 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5">
                <span className="text-[#1F3F47] font-bold">Total Amount:</span>
                <strong className="font-mono font-black text-[#2E9F92]">₹ {new Intl.NumberFormat('en-IN').format(summary.amount)}</strong>
              </div>
            )}
          </div>
        </div>

        {/* 3. Modal Body: Table or Cards */}
        <div className="overflow-y-auto overflow-x-auto flex-1 p-0 relative">
          {isLoading ? (
            <div className="py-28 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="font-semibold text-slate-600">Retrieving live database records from SQL Server...</span>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-24 text-center text-sm text-slate-500">
              No transactions matching the criteria in the selected period.
            </div>
          ) : viewMode === 'cards' ? (
            /* Cards View for Mobile / Compact Screens */
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-[#F7FAFA]">
              {paginatedRecords.map((r, idx) => {
                const globalIdx = (pageSize > 0 ? (currentPage - 1) * pageSize : 0) + idx + 1;
                return (
                  <div key={idx} className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[#252B2E]/60">#{globalIdx}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.org === 'MTM'
                            ? 'bg-[#E96F50]/15 text-[#E96F50] border border-[#E96F50]/30'
                            : 'bg-[#DDF3F0] text-[#1F3F47] border border-[#2E9F92]/40'
                        }`}>
                          {r.org || 'DEPL'}
                        </span>
                        <strong className="font-mono text-xs text-[#252B2E]">{r.docNo}</strong>
                      </div>
                      <span className="font-mono text-xs text-[#252B2E]/70">{formatErpDate(r.date)}</span>
                    </div>

                    <div className="py-2 space-y-1 text-xs">
                      <div className="font-bold text-[#252B2E] truncate" title={r.partyName}>
                        {r.partyName}
                      </div>
                      <div className="flex items-center justify-between text-[#252B2E]/70 text-[11px]">
                        <span>Lot: <strong className="font-mono text-[#252B2E]">{r.lotNo || '-'}</strong></span>
                        <span>DC: <strong className="font-mono text-[#252B2E]">{r.dcNo || '-'}</strong></span>
                      </div>
                      {r.qualitySort && (
                        <div className="font-mono text-[11px] text-[#252B2E] truncate" title={r.qualitySort}>
                          SP: {r.qualitySort}
                        </div>
                      )}
                      {r.remarks && (
                        <div className="text-[11px] text-[#252B2E]/60 truncate" title={r.remarks}>
                          {r.remarks}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-[#252B2E]">
                        {formatMeters(r.meters)}
                      </span>
                      {r.totalAmount ? (
                        <span className="font-mono font-bold text-xs text-[#2E9F92]">
                          ₹ {new Intl.NumberFormat('en-IN').format(r.totalAmount)}
                        </span>
                      ) : r.pieces ? (
                        <span className="text-xs text-[#252B2E]/70 font-mono">
                          {r.pieces} Pcs
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* High-Fidelity Enterprise Table - Unified Executive Teal Palette */
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              {/* Sticky Table Header - Clean Deep Teal with Consistent White Typography */}
              <thead className="bg-[#1F3F47] text-white sticky top-0 z-20 text-[11px] uppercase tracking-wider border-b-2 border-[#345C64] shadow-xs">
                {moduleKey === 'vendor_inward' || moduleKey === 'purchase_inward' ? (
                  <tr>
                    <th className="px-3 py-3 border-r border-[#345C64]/40 text-center w-12 sticky left-0 z-30 bg-[#1F3F47] text-white">#</th>
                    <th className="px-3 py-3 border-r border-[#345C64]/40 text-center w-16 sticky left-12 z-30 bg-[#1F3F47] text-white">Org</th>
                    <th className="px-3.5 py-3 border-r border-[#345C64]/40 sticky left-28 z-30 bg-[#1F3F47] shadow-[2px_0_5px_-1px_rgba(0,0,0,0.3)] text-white">Inw ID</th>
                    <th className="px-3.5 py-3 border-r border-[#345C64]/40 text-white">Inw Date</th>
                    <th className="px-3.5 py-3 border-r border-[#345C64]/40 text-white">Lot No</th>
                    <th className="px-3.5 py-3 border-r border-[#345C64]/40 text-white">Inw Type</th>
                    <th className="px-4 py-3 border-r border-[#345C64]/40 text-white">Vendor Name</th>
                    <th className="px-3.5 py-3 border-r border-[#345C64]/40 text-white">DC No</th>
                    <th className="px-3.5 py-3 border-r border-[#345C64]/40 text-white">DC Date</th>
                    <th className="px-4 py-3 text-right border-r border-[#345C64]/40 text-white">Total Mtrs</th>
                    <th className="px-3.5 py-3 text-right border-r border-[#345C64]/40 text-white">Pcs</th>
                    <th className="px-3.5 py-3 border-r border-[#345C64]/40 text-white">SP No</th>
                    <th className="px-4 py-3 text-white">Fabric Name</th>
                  </tr>
                ) : moduleKey === 'process_delivery' ? (
                  <tr>
                    <th className="px-3 py-3 border-r border-[#345C64]/40 text-center w-12 sticky left-0 z-30 bg-[#1F3F47] text-white">#</th>
                    <th className="px-3 py-3 border-r border-[#345C64]/40 text-center w-16 sticky left-12 z-30 bg-[#1F3F47] text-white">Org</th>
                    <th className="px-3.5 py-3 border-r border-[#345C64]/40 sticky left-28 z-30 bg-[#1F3F47] shadow-[2px_0_5px_-1px_rgba(0,0,0,0.3)] text-white">DC No</th>
                    <th className="px-3.5 py-3 border-r border-[#345C64]/40 text-white">DC Date</th>
                    <th className="px-3.5 py-3 border-r border-[#345C64]/40 text-white">Process Type</th>
                    <th className="px-4 py-3 border-r border-[#345C64]/40 text-white">Mill / Vendor Name</th>
                    <th className="px-3.5 py-3 border-r border-[#345C64]/40 text-white">Lot No</th>
                    <th className="px-4 py-3 text-right border-r border-[#345C64]/40 text-white">Total Mtrs</th>
                    <th className="px-3.5 py-3 text-right border-r border-[#345C64]/40 text-white">Pcs</th>
                    <th className="px-3.5 py-3 border-r border-[#345C64]/40 text-white">SP No</th>
                    <th className="px-4 py-3 text-white">Fabric Name</th>
                  </tr>
                ) : moduleKey === 'process_inward' ? (
                  <tr>
                    <th className="px-3 py-3 border-r border-[#345C64]/40 text-center w-12 sticky left-0 z-30 bg-[#1F3F47] text-white">#</th>
                    <th className="px-3 py-3 border-r border-[#345C64]/40 text-center w-16 sticky left-12 z-30 bg-[#1F3F47] text-white">Org</th>
                    <th className="px-3.5 py-3 border-r border-[#345C64]/40 sticky left-28 z-30 bg-[#1F3F47] shadow-[2px_0_5px_-1px_rgba(0,0,0,0.3)] text-white">Inw ID</th>
                    <th className="px-3.5 py-3 border-r border-[#345C64]/40 text-white">Inw Date</th>
                    <th className="px-4 py-3 border-r border-[#345C64]/40 text-white">Mill Name</th>
                    <th className="px-3.5 py-3 border-r border-[#345C64]/40 text-white">DC No</th>
                    <th className="px-3.5 py-3 border-r border-[#345C64]/40 text-white">Lot No</th>
                    <th className="px-4 py-3 text-right border-r border-[#345C64]/40 text-white">Total Mtrs</th>
                    <th className="px-3.5 py-3 text-right border-r border-[#345C64]/40 text-white">Pcs</th>
                    <th className="px-3.5 py-3 border-r border-[#345C64]/40 text-white">SP No</th>
                    <th className="px-4 py-3 text-white">Fabric Name</th>
                  </tr>
                ) : moduleKey === 'sales_delivery' ? (
                  <tr>
                    <th className="px-3 py-3 border-r border-[#345C64]/40 text-center w-12 sticky left-0 z-30 bg-[#1F3F47] text-white">#</th>
                    <th className="px-3 py-3 border-r border-[#345C64]/40 text-center w-16 sticky left-12 z-30 bg-[#1F3F47] text-white">Org</th>
                    <th className="px-3.5 py-3 border-r border-[#345C64]/40 sticky left-28 z-30 bg-[#1F3F47] shadow-[2px_0_5px_-1px_rgba(0,0,0,0.3)] text-white">Invoice #</th>
                    <th className="px-3.5 py-3 border-r border-[#345C64]/40 text-white">Invoice Date</th>
                    <th className="px-4 py-3 border-r border-[#345C64]/40 text-white">Customer Name</th>
                    <th className="px-3.5 py-3 border-r border-[#345C64]/40 text-white">Design / SP No</th>
                    <th className="px-3.5 py-3 border-r border-[#345C64]/40 text-white">Fabric Type</th>
                    <th className="px-4 py-3 text-right border-r border-[#345C64]/40 text-white">Total Mtrs</th>
                    <th className="px-3.5 py-3 text-right border-r border-[#345C64]/40 text-white">Rate (₹)</th>
                    <th className="px-4 py-3 text-right text-white">Total Amount (₹)</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-3 py-3 border-r border-[#345C64]/40 text-center w-12 sticky left-0 z-30 bg-[#1F3F47] text-white">#</th>
                    <th className="px-3 py-3 border-r border-[#345C64]/40 text-center w-16 sticky left-12 z-30 bg-[#1F3F47] text-white">Org</th>
                    <th className="px-3.5 py-3 border-r border-[#345C64]/40 sticky left-28 z-30 bg-[#1F3F47] shadow-[2px_0_5px_-1px_rgba(0,0,0,0.3)] text-white">Order / PO #</th>
                    <th className="px-3.5 py-3 border-r border-[#345C64]/40 text-white">Order Date</th>
                    <th className="px-3.5 py-3 border-r border-[#345C64]/40 text-white">Order Type</th>
                    <th className="px-4 py-3 border-r border-[#345C64]/40 text-white">Customer Name</th>
                    <th className="px-3.5 py-3 border-r border-[#345C64]/40 text-white">Quality / Sort</th>
                    <th className="px-4 py-3 text-right border-r border-[#345C64]/40 text-white">Order Mtrs</th>
                    <th className="px-3.5 py-3 text-right text-white">Rate (₹)</th>
                  </tr>
                )}
              </thead>

              {/* Table Rows - High Contrast, Clean Teal & Crisp White */}
              <tbody className="divide-y divide-slate-200/80 font-medium">
                {paginatedRecords.map((r, idx) => {
                  const globalIdx = (pageSize > 0 ? (currentPage - 1) * pageSize : 0) + idx + 1;
                  const isEven = idx % 2 === 0;

                  if (moduleKey === 'vendor_inward' || moduleKey === 'purchase_inward') {
                    return (
                      <tr key={idx} className={`hover:bg-[#DDF3F0]/50 transition-colors ${isEven ? 'bg-white' : 'bg-[#F7FAFA]'}`}>
                        <td className={`px-3 py-2.5 text-center text-[#252B2E]/60 font-mono text-[11px] border-r border-slate-200/90 sticky left-0 z-10 ${isEven ? 'bg-white' : 'bg-[#F7FAFA]'}`}>
                          {globalIdx}
                        </td>
                        <td className={`px-3 py-2.5 text-center border-r border-slate-200/90 sticky left-12 z-10 ${isEven ? 'bg-white' : 'bg-[#F7FAFA]'}`}>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.org === 'MTM'
                              ? 'bg-[#E96F50]/15 text-[#E96F50] border border-[#E96F50]/30'
                              : 'bg-[#DDF3F0] text-[#1F3F47] border border-[#2E9F92]/40'
                          }`}>
                            {r.org || 'DEPL'}
                          </span>
                        </td>
                        <td className={`px-3.5 py-2.5 font-mono font-bold text-[#1F3F47] border-r border-slate-200/90 sticky left-28 z-10 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.06)] hover:text-[#2E9F92] transition-colors ${isEven ? 'bg-white' : 'bg-[#F7FAFA]'}`}>
                          {r.docNo}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-[#252B2E]/80 border-r border-slate-200/90">
                          {formatErpDate(r.date)}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-[#252B2E] font-bold border-r border-slate-200/90">
                          {r.lotNo || '-'}
                        </td>
                        <td className="px-3.5 py-2.5 font-medium text-[#252B2E]/80 border-r border-slate-200/90">
                          {r.processType || 'Vendor'}
                        </td>
                        <td className="px-4 py-2.5 font-bold text-[#252B2E] border-r border-slate-200/90">
                          {r.partyName}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-[#252B2E] font-semibold border-r border-slate-200/90">
                          {r.dcNo || '-'}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-[#252B2E]/80 border-r border-slate-200/90">
                          {r.dcDate ? formatErpDate(r.dcDate) : '-'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-black text-sm text-[#252B2E] border-r border-slate-200/90">
                          {formatMeters(r.meters)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono text-[#252B2E]/80 border-r border-slate-200/90">
                          {r.pieces || '-'}
                        </td>
                        <td className="px-3.5 py-2.5 border-r border-slate-200/90">
                          <span className="font-mono text-[#1F3F47] font-bold text-[11px] bg-[#DDF3F0] px-2 py-0.5 rounded border border-[#2E9F92]/30 shadow-2xs">
                            {r.qualitySort || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-[11px] text-[#252B2E]/80 max-w-xs truncate" title={r.remarks}>
                          {r.remarks || '-'}
                        </td>
                      </tr>
                    );
                  }

                  if (moduleKey === 'process_delivery') {
                    return (
                      <tr key={idx} className={`hover:bg-[#DDF3F0]/50 transition-colors ${isEven ? 'bg-white' : 'bg-[#F7FAFA]'}`}>
                        <td className={`px-3 py-2.5 text-center text-[#252B2E]/60 font-mono text-[11px] border-r border-slate-200/90 sticky left-0 z-10 ${isEven ? 'bg-white' : 'bg-[#F7FAFA]'}`}>
                          {globalIdx}
                        </td>
                        <td className={`px-3 py-2.5 text-center border-r border-slate-200/90 sticky left-12 z-10 ${isEven ? 'bg-white' : 'bg-[#F7FAFA]'}`}>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.org === 'MTM'
                              ? 'bg-[#E96F50]/15 text-[#E96F50] border border-[#E96F50]/30'
                              : 'bg-[#DDF3F0] text-[#1F3F47] border border-[#2E9F92]/40'
                          }`}>
                            {r.org || 'DEPL'}
                          </span>
                        </td>
                        <td className={`px-3.5 py-2.5 font-mono font-bold text-[#1F3F47] border-r border-slate-200/90 sticky left-28 z-10 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.06)] hover:text-[#2E9F92] transition-colors ${isEven ? 'bg-white' : 'bg-[#F7FAFA]'}`}>
                          {r.docNo}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-[#252B2E]/80 border-r border-slate-200/90">
                          {formatErpDate(r.date)}
                        </td>
                        <td className="px-3.5 py-2.5 font-medium text-[#252B2E]/80 border-r border-slate-200/90">
                          {r.processType || '-'}
                        </td>
                        <td className="px-4 py-2.5 font-bold text-[#252B2E] border-r border-slate-200/90">
                          {r.partyName}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-[#252B2E] font-bold border-r border-slate-200/90">
                          {r.lotNo || '-'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-black text-sm text-[#252B2E] border-r border-slate-200/90">
                          {formatMeters(r.meters)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono text-[#252B2E]/80 border-r border-slate-200/90">
                          {r.pieces || '-'}
                        </td>
                        <td className="px-3.5 py-2.5 border-r border-slate-200/90">
                          <span className="font-mono text-[#1F3F47] font-bold text-[11px] bg-[#DDF3F0] px-2 py-0.5 rounded border border-[#2E9F92]/30 shadow-2xs">
                            {r.qualitySort || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-[11px] text-[#252B2E]/80 max-w-xs truncate" title={r.remarks}>
                          {r.remarks || '-'}
                        </td>
                      </tr>
                    );
                  }

                  if (moduleKey === 'process_inward') {
                    return (
                      <tr key={idx} className={`hover:bg-[#DDF3F0]/50 transition-colors ${isEven ? 'bg-white' : 'bg-[#F7FAFA]'}`}>
                        <td className={`px-3 py-2.5 text-center text-[#252B2E]/60 font-mono text-[11px] border-r border-slate-200/90 sticky left-0 z-10 ${isEven ? 'bg-white' : 'bg-[#F7FAFA]'}`}>
                          {globalIdx}
                        </td>
                        <td className={`px-3 py-2.5 text-center border-r border-slate-200/90 sticky left-12 z-10 ${isEven ? 'bg-white' : 'bg-[#F7FAFA]'}`}>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.org === 'MTM'
                              ? 'bg-[#E96F50]/15 text-[#E96F50] border border-[#E96F50]/30'
                              : 'bg-[#DDF3F0] text-[#1F3F47] border border-[#2E9F92]/40'
                          }`}>
                            {r.org || 'DEPL'}
                          </span>
                        </td>
                        <td className={`px-3.5 py-2.5 font-mono font-bold text-[#1F3F47] border-r border-slate-200/90 sticky left-28 z-10 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.06)] hover:text-[#2E9F92] transition-colors ${isEven ? 'bg-white' : 'bg-[#F7FAFA]'}`}>
                          {r.docNo}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-[#252B2E]/80 border-r border-slate-200/90">
                          {formatErpDate(r.date)}
                        </td>
                        <td className="px-4 py-2.5 font-bold text-[#252B2E] border-r border-slate-200/90">
                          {r.partyName}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-[#252B2E] font-semibold border-r border-slate-200/90">
                          {r.dcNo || '-'}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-[#252B2E] font-bold border-r border-slate-200/90">
                          {r.lotNo || '-'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-black text-sm text-[#252B2E] border-r border-slate-200/90">
                          {formatMeters(r.meters)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono text-[#252B2E]/80 border-r border-slate-200/90">
                          {r.pieces || '-'}
                        </td>
                        <td className="px-3.5 py-2.5 border-r border-slate-200/90">
                          <span className="font-mono text-[#1F3F47] font-bold text-[11px] bg-[#DDF3F0] px-2 py-0.5 rounded border border-[#2E9F92]/30 shadow-2xs">
                            {r.qualitySort || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-[11px] text-[#252B2E]/80 max-w-xs truncate" title={r.remarks}>
                          {r.remarks || '-'}
                        </td>
                      </tr>
                    );
                  }

                  if (moduleKey === 'sales_delivery') {
                    return (
                      <tr key={idx} className={`hover:bg-[#DDF3F0]/50 transition-colors ${isEven ? 'bg-white' : 'bg-[#F7FAFA]'}`}>
                        <td className={`px-3 py-2.5 text-center text-[#252B2E]/60 font-mono text-[11px] border-r border-slate-200/90 sticky left-0 z-10 ${isEven ? 'bg-white' : 'bg-[#F7FAFA]'}`}>
                          {globalIdx}
                        </td>
                        <td className={`px-3 py-2.5 text-center border-r border-slate-200/90 sticky left-12 z-10 ${isEven ? 'bg-white' : 'bg-[#F7FAFA]'}`}>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.org === 'MTM'
                              ? 'bg-[#E96F50]/15 text-[#E96F50] border border-[#E96F50]/30'
                              : 'bg-[#DDF3F0] text-[#1F3F47] border border-[#2E9F92]/40'
                          }`}>
                            {r.org || 'DEPL'}
                          </span>
                        </td>
                        <td className={`px-3.5 py-2.5 font-mono font-bold text-[#1F3F47] border-r border-slate-200/90 sticky left-28 z-10 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.06)] hover:text-[#2E9F92] transition-colors ${isEven ? 'bg-white' : 'bg-[#F7FAFA]'}`}>
                          {r.docNo}
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-[#252B2E]/80 border-r border-slate-200/90">
                          {formatErpDate(r.date)}
                        </td>
                        <td className="px-4 py-2.5 font-bold text-[#252B2E] border-r border-slate-200/90">
                          {r.partyName}
                        </td>
                        <td className="px-3.5 py-2.5 border-r border-slate-200/90">
                          <span className="font-mono text-[#1F3F47] font-bold text-[11px] bg-[#DDF3F0] px-2 py-0.5 rounded border border-[#2E9F92]/30 shadow-2xs">
                            {r.qualitySort || '-'}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 text-[11px] text-[#252B2E]/80 border-r border-slate-200/90 max-w-xs truncate" title={r.remarks}>
                          {r.remarks || '-'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-black text-sm text-[#252B2E] border-r border-slate-200/90">
                          {formatMeters(r.meters)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono text-xs text-[#252B2E]/80 border-r border-slate-200/90">
                          {r.ratePerMeter ? r.ratePerMeter.toFixed(2) : '-'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-black text-sm text-[#2E9F92]">
                          {r.totalAmount ? `₹ ${new Intl.NumberFormat('en-IN').format(r.totalAmount)}` : '-'}
                        </td>
                      </tr>
                    );
                  }

                  // Default / IBPO / IMPO Orders
                  return (
                    <tr key={idx} className={`hover:bg-[#DDF3F0]/50 transition-colors ${isEven ? 'bg-white' : 'bg-[#F7FAFA]'}`}>
                      <td className={`px-3 py-2.5 text-center text-[#252B2E]/60 font-mono text-[11px] border-r border-slate-200/90 sticky left-0 z-10 ${isEven ? 'bg-white' : 'bg-[#F7FAFA]'}`}>
                        {globalIdx}
                      </td>
                      <td className={`px-3 py-2.5 text-center border-r border-slate-200/90 sticky left-12 z-10 ${isEven ? 'bg-white' : 'bg-[#F7FAFA]'}`}>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.org === 'MTM'
                            ? 'bg-[#E96F50]/15 text-[#E96F50] border border-[#E96F50]/30'
                            : 'bg-[#DDF3F0] text-[#1F3F47] border border-[#2E9F92]/40'
                        }`}>
                          {r.org || 'DEPL'}
                        </span>
                      </td>
                      <td className={`px-3.5 py-2.5 font-mono font-bold text-[#1F3F47] border-r border-slate-200/90 sticky left-28 z-10 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.06)] hover:text-[#2E9F92] transition-colors ${isEven ? 'bg-white' : 'bg-[#F7FAFA]'}`}>
                        {r.docNo}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-[#252B2E]/80 border-r border-slate-200/90">
                        {formatErpDate(r.date)}
                      </td>
                      <td className="px-3.5 py-2.5 font-medium text-[#252B2E]/80 border-r border-slate-200/90">
                        {r.processType || '-'}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-[#252B2E] border-r border-slate-200/90">
                        {r.partyName}
                      </td>
                      <td className="px-3.5 py-2.5 border-r border-slate-200/90">
                        <span className="font-mono text-[#1F3F47] font-bold text-[11px] bg-[#DDF3F0] px-2 py-0.5 rounded border border-[#2E9F92]/30 shadow-2xs">
                          {r.qualitySort || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-black text-sm text-[#252B2E] border-r border-slate-200/90">
                        {formatMeters(r.meters)}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono text-xs text-[#252B2E]/80">
                        {r.ratePerMeter ? r.ratePerMeter.toFixed(2) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 4. Modal Footer - Clean Deep Teal Ribbon */}
        <div className="bg-[#1F3F47] text-[#DDF3F0] px-6 py-2.5 flex flex-wrap items-center justify-between text-xs border-t-2 border-[#345C64] gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <span>Showing: <strong className="text-white font-mono">{paginatedRecords.length}</strong> of <strong className="text-white font-mono">{filteredRecords.length}</strong> records</span>
            <span className="hidden sm:inline text-[#345C64]">•</span>
            <span className="hidden sm:inline">Volume: <strong className="text-white font-mono">{formatMeters(summary.meters, true)}</strong></span>
            {summary.amount > 0 && (
              <>
                <span className="hidden sm:inline text-[#345C64]">•</span>
                <span className="hidden sm:inline">Valuation: <strong className="text-[#2E9F92] font-mono">₹ {new Intl.NumberFormat('en-IN').format(summary.amount)}</strong></span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5 text-[#DDF3F0]">
              <span>Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-[#345C64] text-white border border-white/20 rounded-lg px-2 py-0.5 text-xs font-bold focus:outline-none cursor-pointer"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={0}>All</option>
              </select>
            </div>

            {/* Pagination Buttons */}
            {pageSize > 0 && totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-2.5 py-1 bg-[#345C64] hover:bg-[#27484e] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-bold text-xs border border-white/20 text-white transition-colors"
                >
                  ←
                </button>
                <span className="font-mono text-white text-xs font-bold px-1.5">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 bg-[#345C64] hover:bg-[#27484e] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg font-bold text-xs border border-white/20 text-white transition-colors"
                >
                  →
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="bg-[#345C64] hover:bg-[#27484e] text-white px-3.5 py-1 rounded-lg text-xs font-bold transition-colors border border-white/20"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};