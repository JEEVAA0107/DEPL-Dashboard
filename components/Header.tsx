'use client';

import React, { useState } from 'react';
import { formatRefreshTime } from '@/lib/formatters';
import { OrgFilter } from '@/lib/types';

interface HeaderProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (val: string) => void;
  onToDateChange: (val: string) => void;
  onApplyFilter: () => void;
  onResetFilter: () => void;
  onPresetSelect?: (preset: 'today' | '7d' | '30d' | 'month') => void;
  selectedOrg: OrgFilter;
  onOrgChange: (org: OrgFilter) => void;
  kpiViewMode?: 'executive' | 'all';
  onKpiViewModeChange?: (mode: 'executive' | 'all') => void;
  lastRefreshed: string;
  onRefresh: () => void;
  isLoading: boolean;
  autoRefreshInterval: number;
  onAutoRefreshChange: (interval: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onApplyFilter,
  onResetFilter,
  onPresetSelect,
  selectedOrg,
  onOrgChange,
  kpiViewMode = 'all',
  onKpiViewModeChange,
  lastRefreshed,
  onRefresh,
  isLoading,
  autoRefreshInterval,
  onAutoRefreshChange,
}) => {
  const [activePreset, setActivePreset] = useState<'today' | '7d' | '30d' | 'month' | 'custom'>('today');

  const handlePreset = (preset: 'today' | '7d' | '30d' | 'month') => {
    setActivePreset(preset);
    const end = new Date();
    const start = new Date();

    if (preset === 'today') {
      // today
    } else if (preset === '7d') {
      start.setDate(end.getDate() - 6);
    } else if (preset === '30d') {
      start.setDate(end.getDate() - 29);
    } else if (preset === 'month') {
      start.setDate(1);
    }

    const formatISO = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    const sStr = formatISO(start);
    const eStr = formatISO(end);

    onFromDateChange(sStr);
    onToDateChange(eStr);

    if (onPresetSelect) {
      onPresetSelect(preset);
    }
  };

  return (
    <header className="bg-white border-t-4 border-[#345C64] border-b border-slate-200/90 sticky top-0 z-30 shadow-xs">
      <div className="max-w-[1780px] mx-auto px-6 py-2 flex items-center justify-between gap-3">

        {/* Left Section: Company Official Logo, Brand Name & Division Selector */}
        <div className="flex items-center gap-3.5 py-0.5 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Dinesh Exports PVT LTD - The House Of Textiles"
              className="h-10 md:h-11 w-auto object-contain filter drop-shadow-2xs"
            />
            <div className="flex flex-col">
              <span className="font-extrabold text-[13px] md:text-sm tracking-tight text-[#252B2E] uppercase leading-tight font-sans">
                Dinesh Exports PVT LTD
              </span>
              <span className="text-[10px] md:text-[11px] font-semibold text-[#345C64] tracking-tight leading-none font-sans">
                (The House Of Textiles)
              </span>
            </div>
          </div>

          {/* Division / Company Switcher: DEPL vs MTM vs ALL */}
          <div className="flex items-center bg-[#F7FAFA] p-1 rounded-xl border border-slate-200/70 shadow-2xs">
            <button
              type="button"
              onClick={() => onOrgChange('DEPL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedOrg === 'DEPL'
                  ? 'bg-[#1F3F47] text-white shadow-xs'
                  : 'text-[#252B2E]/70 hover:text-[#252B2E] hover:bg-[#DDF3F0]'
              }`}
              title="DEPL"
            >
              <span className={`w-2 h-2 rounded-full ${selectedOrg === 'DEPL' ? 'bg-[#2E9F92]' : 'bg-slate-400'}`}></span>
              <span>DEPL</span>
            </button>

            <button
              type="button"
              onClick={() => onOrgChange('MTM')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedOrg === 'MTM'
                  ? 'bg-[#E96F50] text-white shadow-xs'
                  : 'text-[#252B2E]/70 hover:text-[#252B2E] hover:bg-[#DDF3F0]'
              }`}
              title="MTM"
            >
              <span className={`w-2 h-2 rounded-full ${selectedOrg === 'MTM' ? 'bg-white' : 'bg-slate-400'}`}></span>
              <span>MTM</span>
            </button>

            <button
              type="button"
              onClick={() => onOrgChange('ALL')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedOrg === 'ALL'
                  ? 'bg-[#345C64] text-white shadow-xs'
                  : 'text-[#252B2E]/70 hover:text-[#252B2E] hover:bg-[#DDF3F0]'
              }`}
              title="ALL"
            >
              <span className={`w-2 h-2 rounded-full ${selectedOrg === 'ALL' ? 'bg-[#DDF3F0]' : 'bg-slate-400'}`}></span>
              <span>ALL</span>
            </button>
          </div>

          {/* Module Grid vs 4-Point View Switcher (Moved into Header to remove gap above cards) */}
          {onKpiViewModeChange && (
            <div className="hidden sm:flex items-center bg-[#F7FAFA] p-1 rounded-xl border border-slate-200/70 shadow-2xs">
              <button
                type="button"
                onClick={() => onKpiViewModeChange('executive')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  kpiViewMode === 'executive'
                    ? 'bg-[#1F3F47] text-white shadow-xs'
                    : 'text-[#252B2E]/70 hover:text-[#252B2E] hover:bg-[#DDF3F0]'
                }`}
                title="Executive 4-Point Overview"
              >
                <span className={`w-2 h-2 rounded-full ${kpiViewMode === 'executive' ? 'bg-[#2E9F92]' : 'bg-slate-400'}`}></span>
                <span>Executive 4-Point</span>
              </button>

              <button
                type="button"
                onClick={() => onKpiViewModeChange('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  kpiViewMode === 'all'
                    ? 'bg-[#1F3F47] text-white shadow-xs'
                    : 'text-[#252B2E]/70 hover:text-[#252B2E] hover:bg-[#DDF3F0]'
                }`}
                title="All 7 Modules Grid"
              >
                <span className={`w-2 h-2 rounded-full ${kpiViewMode === 'all' ? 'bg-[#2E9F92]' : 'bg-slate-400'}`}></span>
                <span>All 7 Modules Grid</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Section: Controls */}
        <div className="flex items-center gap-3 text-xs flex-shrink-0">

          {/* Quick Date Presets Pill */}
          <div className="flex items-center bg-[#F7FAFA] p-1 rounded-xl border border-slate-200/70 shadow-2xs">
            <button
              type="button"
              onClick={() => handlePreset('today')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${activePreset === 'today'
                ? 'bg-[#1F3F47] text-white shadow-xs font-bold'
                : 'text-[#252B2E]/70 hover:text-[#252B2E] hover:bg-[#DDF3F0]'
                }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handlePreset('7d')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${activePreset === '7d'
                ? 'bg-[#1F3F47] text-white shadow-xs font-bold'
                : 'text-[#252B2E]/70 hover:text-[#252B2E] hover:bg-[#DDF3F0]'
                }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => handlePreset('30d')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${activePreset === '30d'
                ? 'bg-[#1F3F47] text-white shadow-xs font-bold'
                : 'text-[#252B2E]/70 hover:text-[#252B2E] hover:bg-[#DDF3F0]'
                }`}
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => handlePreset('month')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${activePreset === 'month'
                ? 'bg-[#1F3F47] text-white shadow-xs font-bold'
                : 'text-[#252B2E]/70 hover:text-[#252B2E] hover:bg-[#DDF3F0]'
                }`}
            >
              This Month
            </button>

            {/* Custom Mode: When clicked, displays ONLY From and To inputs right here on the same line */}
            {activePreset !== 'custom' ? (
              <button
                type="button"
                onClick={() => setActivePreset('custom')}
                className="px-3 py-1.5 rounded-lg font-semibold transition-all text-[#252B2E]/70 hover:text-[#252B2E] hover:bg-[#DDF3F0]"
                title="Custom Date Range"
              >
                Custom
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-lg border border-[#345C64]/40 shadow-2xs">
                <span className="text-[11px] font-bold text-[#345C64] uppercase">From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && val.length === 10) {
                      onFromDateChange(val);
                      if (toDate && val > toDate) {
                        onToDateChange(val);
                      }
                    }
                  }}
                  className="bg-transparent text-[#252B2E] text-xs font-mono font-semibold focus:outline-none cursor-pointer"
                />
                <span className="text-[11px] font-bold text-[#345C64] uppercase ml-1">To</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && val.length === 10) {
                      onToDateChange(val);
                      if (fromDate && val < fromDate) {
                        onFromDateChange(val);
                      }
                    }
                  }}
                  className="bg-transparent text-[#252B2E] text-xs font-mono font-semibold focus:outline-none cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Clean Refresh Controls & Sync Settings */}
          <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
            {/* Sync Interval Selector (Functions remain, 'Auto' word removed) */}
            <div className="flex items-center gap-1 bg-[#F7FAFA] border border-slate-200 rounded-xl px-2 py-1" title="Database Synchronization Interval">
              <svg className="w-3 h-3 text-[#345C64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <select
                value={autoRefreshInterval}
                onChange={(e) => onAutoRefreshChange(Number(e.target.value))}
                className="bg-transparent text-[#252B2E] text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value={0}>Off</option>
                <option value={30}>30s</option>
                <option value={60}>1m</option>
                <option value={300}>5m</option>
              </select>
            </div>

            {/* Manual Refresh Button (Full functionality & spin animation remain, 'Refresh' word removed) */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center justify-center bg-[#F7FAFA] hover:bg-[#DDF3F0] text-[#1F3F47] border border-slate-200 p-2 rounded-xl transition-all shadow-2xs font-semibold text-xs active:scale-95 disabled:opacity-50"
              title="Refresh Live Data Directly from SQL Server"
            >
              <svg
                className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#2E9F92]' : 'text-[#345C64]'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* Live Indicator Dot */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#DDF3F0] border border-[#2E9F92]/40 text-[#1F3F47] rounded-xl font-medium text-[11px]" title="Live SQL Server Connected">
              <span className="w-2 h-2 rounded-full bg-[#2E9F92] animate-pulse"></span>
              <span suppressHydrationWarning className="hidden md:inline font-mono text-[11px] font-semibold">
                {lastRefreshed || 'Live'}
              </span>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
