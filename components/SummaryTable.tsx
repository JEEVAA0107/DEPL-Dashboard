'use client';

import React, { useState, useMemo } from 'react';
import { DailyTransactionSummaryRow, BusinessModuleKey } from '@/lib/types';
import { formatMeters, formatCount, formatErpDate } from '@/lib/formatters';

interface SummaryTableProps {
  rows: DailyTransactionSummaryRow[];
  totals: Omit<DailyTransactionSummaryRow, 'id' | 'date'>;
  onRowClick: (date: string, moduleKey?: BusinessModuleKey) => void;
  isLoading: boolean;
}

export const SummaryTable: React.FC<SummaryTableProps> = ({
  rows,
  totals,
  onRowClick,
  isLoading
}) => {
  const [tableMode, setTableMode] = useState<'clean' | 'detailed' | 'cards'>('clean');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof DailyTransactionSummaryRow>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    let result = [...rows];

    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(r =>
        r.date.includes(q) ||
        formatErpDate(r.date).toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDir === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    return result;
  }, [rows, searchTerm, sortKey, sortDir]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    if (pageSize === 0) return filteredData;
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleSort = (key: keyof DailyTransactionSummaryRow) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
    setCurrentPage(1);
  };

  const exportToExcel = () => {
    const headers = [
      'Date',
      'Vendor Inward DC', 'Vendor Inward Mtr',
      'Purchase Inward DC', 'Purchase Inward Mtr',
      'Process Delivery DC', 'Process Delivery Mtr',
      'Process Inward DC', 'Process Inward Mtr',
      'Sales Invoice', 'Sales Mtr',
      'IBPO Orders', 'IBPO Mtr',
      'IMPO Orders', 'IMPO Mtr'
    ];

    const csvRows = [headers.join(',')];

    filteredData.forEach(r => {
      csvRows.push([
        `"${formatErpDate(r.date)}"`,
        r.vendorInwardDc, r.vendorInwardMtr,
        r.purchaseInwardDc, r.purchaseInwardMtr,
        r.processDeliveryDc, r.processDeliveryMtr,
        r.processInwardDc, r.processInwardMtr,
        r.salesInvoice, r.salesMtr,
        r.ibpoOrders, r.ibpoMtr,
        r.impoOrders, r.impoMtr
      ].join(','));
    });

    csvRows.push([
      '"TOTAL"',
      totals.vendorInwardDc, totals.vendorInwardMtr,
      totals.purchaseInwardDc, totals.purchaseInwardMtr,
      totals.processDeliveryDc, totals.processDeliveryMtr,
      totals.processInwardDc, totals.processInwardMtr,
      totals.salesInvoice, totals.salesMtr,
      totals.ibpoOrders, totals.ibpoMtr,
      totals.impoOrders, totals.impoMtr
    ].join(','));

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DEPL_Daily_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden mb-6 transition-all">

      {/* Modern Table Toolbar */}
      <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-gradient-to-r from-[#F7FAFA] to-white">

        {/* Title & View Switcher */}
        <div className="flex items-center flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1F3F47] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <svg className="w-4 h-4 text-[#DDF3F0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#252B2E] tracking-tight">
                  Daily Master Register
                </h3>
                <span className="text-[11px] font-bold text-[#1F3F47] bg-[#DDF3F0] border border-[#2E9F92]/30 px-2.5 py-0.5 rounded-full">
                  {filteredData.length} Days
                </span>
              </div>
              <p className="text-[11px] text-[#252B2E]/60">
                Itemized transaction counts and total meters by date
              </p>
            </div>
          </div>

          {/* User-Friendly View Mode Switcher Pill */}
          <div className="flex items-center bg-[#F7FAFA] p-1 rounded-xl text-xs gap-1 border border-slate-200/80 shadow-2xs">
            <button
              onClick={() => setTableMode('clean')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                tableMode === 'clean'
                  ? 'bg-[#1F3F47] text-white shadow-xs'
                  : 'text-[#252B2E]/70 hover:text-[#252B2E] hover:bg-[#DDF3F0]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tableMode === 'clean' ? 'bg-[#2E9F92]' : 'bg-slate-400'}`}></span>
              <span>Clean Summary</span>
              <span className={`text-[10px] hidden sm:inline ${tableMode === 'clean' ? 'text-white/70' : 'text-slate-400'}`}>(6 Cols)</span>
            </button>

            <button
              onClick={() => setTableMode('detailed')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                tableMode === 'detailed'
                  ? 'bg-[#1F3F47] text-white shadow-xs'
                  : 'text-[#252B2E]/70 hover:text-[#252B2E] hover:bg-[#DDF3F0]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tableMode === 'detailed' ? 'bg-[#2E9F92]' : 'bg-slate-400'}`}></span>
              <span>Full Master</span>
              <span className={`text-[10px] hidden sm:inline ${tableMode === 'detailed' ? 'text-white/70' : 'text-slate-400'}`}>(15 Cols)</span>
            </button>

            <button
              onClick={() => setTableMode('cards')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                tableMode === 'cards'
                  ? 'bg-[#1F3F47] text-white shadow-xs'
                  : 'text-[#252B2E]/70 hover:text-[#252B2E] hover:bg-[#DDF3F0]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${tableMode === 'cards' ? 'bg-[#2E9F92]' : 'bg-slate-400'}`}></span>
              <span>Cards</span>
              <span className={`text-[10px] hidden sm:inline ${tableMode === 'cards' ? 'text-white/70' : 'text-slate-400'}`}>(Mobile)</span>
            </button>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="relative">
            <input
              type="text"
              placeholder="Search date (e.g. 18-Nov)..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 rounded-xl pl-8 pr-7 py-1.5 text-xs text-[#252B2E] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#345C64]/30 focus:border-[#345C64] w-52 shadow-2xs font-medium"
            />
            <svg
              className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1.5 text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Export CSV Button */}
          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 bg-[#2E9F92] hover:bg-[#258378] text-white px-3.5 py-1.5 rounded-xl font-bold transition-all shadow-2xs active:scale-95"
            title="Export filtered daily records to Excel (CSV)"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Excel Export</span>
          </button>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 1. CLEAN SUMMARY TABLE (6 COLUMNS)                       */}
      {/* ======================================================== */}
      {tableMode === 'clean' && (
        <div className="overflow-x-auto relative">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-[#1F3F47] text-white font-bold text-[11px] uppercase tracking-wider shadow-xs sticky top-0 z-20 border-b-2 border-[#345C64]">
                <th
                  onClick={() => handleSort('date')}
                  className="py-3 px-4 cursor-pointer hover:bg-[#183238] transition-colors sticky left-0 z-30 bg-[#1F3F47] border-r border-[#345C64]/40 w-36 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.3)] text-white"
                >
                  <div className="flex items-center justify-between">
                    <span>Date</span>
                    <span className="text-[#DDF3F0] text-xs">{sortKey === 'date' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </div>
                </th>
                <th className="py-3 px-4 text-right text-white border-r border-[#345C64]/40">
                  Fabric Inward (Mtr)
                </th>
                <th className="py-3 px-4 text-right text-white border-r border-[#345C64]/40">
                  Mill Processing (Mtr)
                </th>
                <th className="py-3 px-4 text-right text-white border-r border-[#345C64]/40">
                  Sales Dispatch (Mtr)
                </th>
                <th className="py-3 px-4 text-right text-white border-r border-[#345C64]/40">
                  Orders Booked (Mtr)
                </th>
                <th className="py-3 px-4 text-center text-white w-28">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No records found for the selected date range.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => {
                  const dayInward = row.vendorInwardMtr + row.purchaseInwardMtr;
                  const dayInwardDc = row.vendorInwardDc + row.purchaseInwardDc;
                  const dayProc = row.processDeliveryMtr + row.processInwardMtr;
                  const dayProcDc = row.processDeliveryDc + row.processInwardDc;
                  const dayOrders = row.ibpoMtr + row.impoMtr;
                  const dayOrdersCount = row.ibpoOrders + row.impoOrders;
                  const isEven = idx % 2 === 0;

                  return (
                    <tr
                      key={row.id}
                      onClick={() => onRowClick(row.date)}
                      className={`hover:bg-[#DDF3F0]/40 transition-colors cursor-pointer group ${
                        isEven ? 'bg-white' : 'bg-[#F7FAFA]'
                      }`}
                    >
                      {/* Sticky Date Column */}
                      <td className={`py-3 px-4 font-bold text-[#252B2E] sticky left-0 z-10 border-r border-slate-200/80 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.06)] group-hover:bg-[#DDF3F0] ${
                        isEven ? 'bg-white' : 'bg-[#F7FAFA]'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-[#2E9F92] transition-colors"></span>
                          <span>{formatErpDate(row.date)}</span>
                        </div>
                      </td>

                      {/* Inward */}
                      <td 
                        className="py-3 px-4 text-right border-r border-slate-100 hover:bg-[#DDF3F0]/60 transition-colors"
                        onClick={(e) => { e.stopPropagation(); onRowClick(row.date, 'vendor_inward'); }}
                        title="Click to view Vendor Inward Ledger"
                      >
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-mono font-bold text-[#252B2E]">{formatMeters(dayInward)}</span>
                          <span className="text-[10px] font-bold text-[#1F3F47] bg-[#DDF3F0] border border-[#2E9F92]/30 px-2 py-0.5 rounded-md font-mono shadow-2xs">
                            {dayInwardDc} DCs
                          </span>
                        </div>
                      </td>

                      {/* Mill Processing */}
                      <td 
                        className="py-3 px-4 text-right border-r border-slate-100 hover:bg-[#DDF3F0]/60 transition-colors"
                        onClick={(e) => { e.stopPropagation(); onRowClick(row.date, 'process_delivery'); }}
                        title="Click to view Process Delivery Ledger"
                      >
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-mono font-bold text-[#252B2E]">{formatMeters(dayProc)}</span>
                          <span className="text-[10px] font-bold text-[#1F3F47] bg-[#DDF3F0] border border-[#2E9F92]/30 px-2 py-0.5 rounded-md font-mono shadow-2xs">
                            {dayProcDc} DCs
                          </span>
                        </div>
                      </td>

                      {/* Sales */}
                      <td 
                        className="py-3 px-4 text-right border-r border-slate-100 hover:bg-[#DDF3F0]/60 transition-colors"
                        onClick={(e) => { e.stopPropagation(); onRowClick(row.date, 'sales_delivery'); }}
                        title="Click to view Sales Delivery Ledger"
                      >
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-mono font-bold text-[#252B2E]">{formatMeters(row.salesMtr)}</span>
                          <span className="text-[10px] font-bold text-[#1F3F47] bg-[#DDF3F0] border border-[#2E9F92]/30 px-2 py-0.5 rounded-md font-mono shadow-2xs">
                            {row.salesInvoice} Inv
                          </span>
                        </div>
                      </td>

                      {/* Orders */}
                      <td 
                        className="py-3 px-4 text-right border-r border-slate-100 hover:bg-[#DDF3F0]/60 transition-colors"
                        onClick={(e) => { e.stopPropagation(); onRowClick(row.date, 'ibpo'); }}
                        title="Click to view Orders Ledger"
                      >
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-mono font-bold text-[#252B2E]">{formatMeters(dayOrders)}</span>
                          <span className="text-[10px] font-bold text-[#1F3F47] bg-[#DDF3F0] border border-[#2E9F92]/30 px-2 py-0.5 rounded-md font-mono shadow-2xs">
                            {dayOrdersCount} POs
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRowClick(row.date, 'vendor_inward');
                          }}
                          className="text-[11px] font-bold text-[#1F3F47] bg-[#DDF3F0] hover:bg-[#1F3F47] hover:text-white px-3 py-1 rounded-lg transition-all shadow-2xs flex items-center gap-1 mx-auto"
                          title="Open register for this date"
                        >
                          <span>Inspect</span>
                          <span>→</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Sticky Totals Row */}
            <tfoot>
              <tr className="bg-[#1F3F47] text-white font-bold text-xs sticky bottom-0 z-20 border-t-2 border-[#345C64]">
                <td className="py-3.5 px-4 sticky left-0 z-30 bg-[#1F3F47] border-r border-[#345C64]/40 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.3)] text-white font-bold">
                  PERIOD TOTALS
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-white font-bold border-r border-[#345C64]/40">
                  {formatMeters(totals.vendorInwardMtr + totals.purchaseInwardMtr, true)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-white font-bold border-r border-[#345C64]/40">
                  {formatMeters(totals.processDeliveryMtr + totals.processInwardMtr, true)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-white font-bold border-r border-[#345C64]/40">
                  {formatMeters(totals.salesMtr, true)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-white font-bold border-r border-[#345C64]/40">
                  {formatMeters(totals.ibpoMtr + totals.impoMtr, true)}
                </td>
                <td className="py-3.5 px-4 text-center text-[#DDF3F0] font-mono text-[11px]">
                  {filteredData.length} Days
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. DETAILED 15-COLUMN MASTER REGISTER (GROUPED HEADERS)  */}
      {/* ======================================================== */}
      {tableMode === 'detailed' && (
        <div className="overflow-x-auto relative">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              {/* Tier 1 Group Header */}
              <tr className="bg-[#1F3F47] text-white text-[10px] uppercase font-bold tracking-wider text-center border-b border-[#345C64]/40">
                <th rowSpan={2} className="py-2.5 px-3 sticky left-0 z-30 bg-[#1F3F47] border-r border-[#345C64]/40 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.3)] text-white">
                  Date
                </th>
                <th colSpan={4} className="py-2 px-2 bg-[#1F3F47] text-white border-r border-[#345C64]/40 font-bold">
                  1. Fabric Inward Intake
                </th>
                <th colSpan={4} className="py-2 px-2 bg-[#1F3F47] text-white border-r border-[#345C64]/40 font-bold">
                  2. Mill Processing Flow
                </th>
                <th colSpan={2} className="py-2 px-2 bg-[#1F3F47] text-white border-r border-[#345C64]/40 font-bold">
                  3. Sales Dispatch
                </th>
                <th colSpan={4} className="py-2 px-2 bg-[#1F3F47] text-white font-bold">
                  4. Customer Orders
                </th>
              </tr>

              {/* Tier 2 Column Headers */}
              <tr className="bg-[#345C64] text-white font-bold border-b-2 border-[#1F3F47] text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-2 text-right border-r border-[#1F3F47]/40 text-[#DDF3F0]">VI DC</th>
                <th className="py-2.5 px-2.5 text-right border-r border-[#1F3F47]/40 text-white font-bold">VI Mtr</th>
                <th className="py-2.5 px-2 text-right border-r border-[#1F3F47]/40 text-[#DDF3F0]">PI DC</th>
                <th className="py-2.5 px-2.5 text-right border-r border-[#1F3F47]/40 text-white font-bold">PI Mtr</th>
                <th className="py-2.5 px-2 text-right border-r border-[#1F3F47]/40 text-[#DDF3F0]">PD DC</th>
                <th className="py-2.5 px-2.5 text-right border-r border-[#1F3F47]/40 text-white font-bold">PD Mtr</th>
                <th className="py-2.5 px-2 text-right border-r border-[#1F3F47]/40 text-[#DDF3F0]">PI Inw DC</th>
                <th className="py-2.5 px-2.5 text-right border-r border-[#1F3F47]/40 text-white font-bold">PI Inw Mtr</th>
                <th className="py-2.5 px-2 text-right border-r border-[#1F3F47]/40 text-[#DDF3F0]">SD Inv</th>
                <th className="py-2.5 px-2.5 text-right border-r border-[#1F3F47]/40 text-white font-bold">SD Mtr</th>
                <th className="py-2.5 px-2 text-right border-r border-[#1F3F47]/40 text-[#DDF3F0]">IBPO</th>
                <th className="py-2.5 px-2.5 text-right border-r border-[#1F3F47]/40 text-white font-bold">IBPO Mtr</th>
                <th className="py-2.5 px-2 text-right border-r border-[#1F3F47]/40 text-[#DDF3F0]">IMPO</th>
                <th className="py-2.5 px-2.5 text-right text-white font-bold">IMPO Mtr</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 font-medium font-mono text-[11px]">
              {paginatedData.map((row, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <tr
                    key={row.id}
                    className={`hover:bg-[#DDF3F0]/40 transition-colors ${isEven ? 'bg-white' : 'bg-[#F7FAFA]'}`}
                  >
                    <td 
                      onClick={() => onRowClick(row.date, 'vendor_inward')}
                      className={`py-2 px-3 font-bold font-sans text-[#252B2E] whitespace-nowrap cursor-pointer hover:underline hover:text-[#2E9F92] sticky left-0 z-10 border-r border-slate-200 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.06)] group-hover:bg-[#DDF3F0] ${
                        isEven ? 'bg-white' : 'bg-[#F7FAFA]'
                      }`}
                      title="Click to view Vendor Inward for this date"
                    >
                      {formatErpDate(row.date)}
                    </td>
                    <td className="py-2 px-2 text-right text-[#252B2E]/70 cursor-pointer hover:bg-[#DDF3F0]/60 border-r border-slate-100" onClick={() => onRowClick(row.date, 'vendor_inward')}>{row.vendorInwardDc}</td>
                    <td className="py-2 px-2.5 text-right font-bold text-[#252B2E] cursor-pointer hover:bg-[#DDF3F0]/60 border-r border-slate-100" onClick={() => onRowClick(row.date, 'vendor_inward')}>{formatMeters(row.vendorInwardMtr)}</td>
                    <td className="py-2 px-2 text-right text-[#252B2E]/70 cursor-pointer hover:bg-[#DDF3F0]/60 border-r border-slate-100" onClick={() => onRowClick(row.date, 'purchase_inward')}>{row.purchaseInwardDc}</td>
                    <td className="py-2 px-2.5 text-right font-bold text-[#252B2E] cursor-pointer hover:bg-[#DDF3F0]/60 border-r border-slate-100" onClick={() => onRowClick(row.date, 'purchase_inward')}>{formatMeters(row.purchaseInwardMtr)}</td>
                    <td className="py-2 px-2 text-right text-[#252B2E]/70 cursor-pointer hover:bg-[#DDF3F0]/60 border-r border-slate-100" onClick={() => onRowClick(row.date, 'process_delivery')}>{row.processDeliveryDc}</td>
                    <td className="py-2 px-2.5 text-right font-bold text-[#252B2E] cursor-pointer hover:bg-[#DDF3F0]/60 border-r border-slate-100" onClick={() => onRowClick(row.date, 'process_delivery')}>{formatMeters(row.processDeliveryMtr)}</td>
                    <td className="py-2 px-2 text-right text-[#252B2E]/70 cursor-pointer hover:bg-[#DDF3F0]/60 border-r border-slate-100" onClick={() => onRowClick(row.date, 'process_inward')}>{row.processInwardDc}</td>
                    <td className="py-2 px-2.5 text-right font-bold text-[#252B2E] cursor-pointer hover:bg-[#DDF3F0]/60 border-r border-slate-100" onClick={() => onRowClick(row.date, 'process_inward')}>{formatMeters(row.processInwardMtr)}</td>
                    <td className="py-2 px-2 text-right text-[#252B2E]/70 cursor-pointer hover:bg-[#DDF3F0]/60 border-r border-slate-100" onClick={() => onRowClick(row.date, 'sales_delivery')}>{row.salesInvoice}</td>
                    <td className="py-2 px-2.5 text-right font-bold text-[#252B2E] cursor-pointer hover:bg-[#DDF3F0]/60 border-r border-slate-100" onClick={() => onRowClick(row.date, 'sales_delivery')}>{formatMeters(row.salesMtr)}</td>
                    <td className="py-2 px-2 text-right text-[#252B2E]/70 cursor-pointer hover:bg-[#DDF3F0]/60 border-r border-slate-100" onClick={() => onRowClick(row.date, 'ibpo')}>{row.ibpoOrders}</td>
                    <td className="py-2 px-2.5 text-right font-bold text-[#252B2E] cursor-pointer hover:bg-[#DDF3F0]/60 border-r border-slate-100" onClick={() => onRowClick(row.date, 'ibpo')}>{formatMeters(row.ibpoMtr)}</td>
                    <td className="py-2 px-2 text-right text-[#252B2E]/70 cursor-pointer hover:bg-[#DDF3F0]/60 border-r border-slate-100" onClick={() => onRowClick(row.date, 'impo')}>{row.impoOrders}</td>
                    <td className="py-2 px-2.5 text-right font-bold text-[#252B2E] cursor-pointer hover:bg-[#DDF3F0]/60" onClick={() => onRowClick(row.date, 'impo')}>{formatMeters(row.impoMtr)}</td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot>
              <tr className="bg-[#1F3F47] text-white font-bold text-xs font-mono border-t-2 border-[#345C64]">
                <td className="py-3 px-3 font-sans sticky left-0 z-30 bg-[#1F3F47] border-r border-[#345C64]/40 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.3)] text-white font-bold">TOTALS</td>
                <td className="py-3 px-2 text-right text-[#DDF3F0] border-r border-[#345C64]/40">{totals.vendorInwardDc}</td>
                <td className="py-3 px-2.5 text-right text-white font-bold border-r border-[#345C64]/40">{formatMeters(totals.vendorInwardMtr)}</td>
                <td className="py-3 px-2 text-right text-[#DDF3F0] border-r border-[#345C64]/40">{totals.purchaseInwardDc}</td>
                <td className="py-3 px-2.5 text-right text-white font-bold border-r border-[#345C64]/40">{formatMeters(totals.purchaseInwardMtr)}</td>
                <td className="py-3 px-2 text-right text-[#DDF3F0] border-r border-[#345C64]/40">{totals.processDeliveryDc}</td>
                <td className="py-3 px-2.5 text-right text-white font-bold border-r border-[#345C64]/40">{formatMeters(totals.processDeliveryMtr)}</td>
                <td className="py-3 px-2 text-right text-[#DDF3F0] border-r border-[#345C64]/40">{totals.processInwardDc}</td>
                <td className="py-3 px-2.5 text-right text-white font-bold border-r border-[#345C64]/40">{formatMeters(totals.processInwardMtr)}</td>
                <td className="py-3 px-2 text-right text-[#DDF3F0] border-r border-[#345C64]/40">{totals.salesInvoice}</td>
                <td className="py-3 px-2.5 text-right text-white font-bold border-r border-[#345C64]/40">{formatMeters(totals.salesMtr)}</td>
                <td className="py-3 px-2 text-right text-[#DDF3F0] border-r border-[#345C64]/40">{totals.ibpoOrders}</td>
                <td className="py-3 px-2.5 text-right text-white font-bold border-r border-[#345C64]/40">{formatMeters(totals.ibpoMtr)}</td>
                <td className="py-3 px-2 text-right text-[#DDF3F0] border-r border-[#345C64]/40">{totals.impoOrders}</td>
                <td className="py-3 px-2.5 text-right text-white font-bold">{formatMeters(totals.impoMtr)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. RESPONSIVE CARDS MODE (EXCELLENT FOR MOBILE / TABLET)  */}
      {/* ======================================================== */}
      {tableMode === 'cards' && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-[#F7FAFA]">
          {paginatedData.map((row) => {
            const dayInward = row.vendorInwardMtr + row.purchaseInwardMtr;
            const dayInwardDc = row.vendorInwardDc + row.purchaseInwardDc;
            const dayProc = row.processDeliveryMtr + row.processInwardMtr;
            const dayProcDc = row.processDeliveryDc + row.processInwardDc;
            const dayOrders = row.ibpoMtr + row.impoMtr;
            const dayOrdersCount = row.ibpoOrders + row.impoOrders;

            return (
              <div 
                key={row.id}
                className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#345C64]"></span>
                    <span className="font-bold text-sm text-[#252B2E]">{formatErpDate(row.date)}</span>
                  </div>
                  <button
                    onClick={() => onRowClick(row.date, 'vendor_inward')}
                    className="text-xs font-bold text-[#1F3F47] hover:text-white bg-[#DDF3F0] hover:bg-[#1F3F47] px-2.5 py-1 rounded-lg transition-colors"
                  >
                    View Ledger →
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 text-xs">
                  {/* Inward */}
                  <div 
                    onClick={() => onRowClick(row.date, 'vendor_inward')}
                    className="p-2.5 bg-[#F7FAFA] hover:bg-[#DDF3F0]/60 border border-slate-200/70 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[#252B2E]/70 font-semibold mb-1">
                      <span>Inward</span>
                      <span className="font-mono text-[10px] bg-white border border-[#2E9F92]/30 px-1.5 py-0.5 rounded text-[#1F3F47] font-bold">{dayInwardDc} DCs</span>
                    </div>
                    <div className="font-mono font-bold text-[#252B2E] text-sm">
                      {formatMeters(dayInward)}
                    </div>
                  </div>

                  {/* Mill Processing */}
                  <div 
                    onClick={() => onRowClick(row.date, 'process_delivery')}
                    className="p-2.5 bg-[#F7FAFA] hover:bg-[#DDF3F0]/60 border border-slate-200/70 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[#252B2E]/70 font-semibold mb-1">
                      <span>Processing</span>
                      <span className="font-mono text-[10px] bg-white border border-[#2E9F92]/30 px-1.5 py-0.5 rounded text-[#1F3F47] font-bold">{dayProcDc} DCs</span>
                    </div>
                    <div className="font-mono font-bold text-[#252B2E] text-sm">
                      {formatMeters(dayProc)}
                    </div>
                  </div>

                  {/* Sales */}
                  <div 
                    onClick={() => onRowClick(row.date, 'sales_delivery')}
                    className="p-2.5 bg-[#F7FAFA] hover:bg-[#DDF3F0]/60 border border-slate-200/70 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[#252B2E]/70 font-semibold mb-1">
                      <span>Sales</span>
                      <span className="font-mono text-[10px] bg-white border border-[#2E9F92]/30 px-1.5 py-0.5 rounded text-[#1F3F47] font-bold">{row.salesInvoice} Inv</span>
                    </div>
                    <div className="font-mono font-bold text-[#252B2E] text-sm">
                      {formatMeters(row.salesMtr)}
                    </div>
                  </div>

                  {/* Orders */}
                  <div 
                    onClick={() => onRowClick(row.date, 'ibpo')}
                    className="p-2.5 bg-[#F7FAFA] hover:bg-[#DDF3F0]/60 border border-slate-200/70 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[#252B2E]/70 font-semibold mb-1">
                      <span>Orders</span>
                      <span className="font-mono text-[10px] bg-white border border-[#E96F50]/30 px-1.5 py-0.5 rounded text-[#E96F50] font-bold">{dayOrdersCount} POs</span>
                    </div>
                    <div className="font-mono font-bold text-[#252B2E] text-sm">
                      {formatMeters(dayOrders)}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#252B2E]/70">
                  <span>Vendor: <strong className="text-[#252B2E] font-mono">{formatMeters(row.vendorInwardMtr)}</strong></span>
                  <span>Purch: <strong className="text-[#252B2E] font-mono">{formatMeters(row.purchaseInwardMtr)}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modern Pagination Footer */}
      <div className="px-5 py-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-[#252B2E]/70 bg-white">
        <div className="flex items-center gap-2">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-[#F7FAFA] border border-slate-200 rounded-lg px-2 py-1 text-[#252B2E] font-bold focus:outline-none cursor-pointer"
          >
            <option value={10}>10 days</option>
            <option value={20}>20 days</option>
            <option value={30}>30 days</option>
            <option value={0}>All days</option>
          </select>
          <span>of <strong className="text-[#252B2E] font-mono">{filteredData.length}</strong> days</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
            disabled={currentPage === 1 || pageSize === 0}
            className="px-3 py-1 bg-[#F7FAFA] hover:bg-[#DDF3F0] text-[#1F3F47] rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition-all shadow-2xs"
          >
            ← Prev
          </button>

          <span className="px-2 font-mono font-bold text-[#252B2E]">
            {pageSize === 0 ? 'Showing All' : `Page ${currentPage} of ${totalPages}`}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages || pageSize === 0}
            className="px-3 py-1 bg-[#F7FAFA] hover:bg-[#DDF3F0] text-[#1F3F47] rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition-all shadow-2xs"
          >
            Next →
          </button>
        </div>
      </div>

    </div>
  );
};