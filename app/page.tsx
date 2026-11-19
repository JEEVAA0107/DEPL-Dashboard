'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { KpiCards } from '@/components/KpiCards';
import { AnalyticsCharts } from '@/components/AnalyticsCharts';
import { SummaryTable } from '@/components/SummaryTable';
import { DrilldownModal } from '@/components/DrilldownModal';
import {
  KpiSummaryResponse,
  ChartsDataResponse,
  TableSummaryResponse,
  DrilldownResponse,
  BusinessModuleKey,
  OrgFilter
} from '@/lib/types';
import { formatRefreshTime } from '@/lib/formatters';

export default function SinglePageDashboard() {
  const getLocalDateISO = (d: Date = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [fromDate, setFromDate] = useState<string>(() => getLocalDateISO());
  const [toDate, setToDate] = useState<string>(() => getLocalDateISO());
  const [selectedOrg, setSelectedOrg] = useState<OrgFilter>('DEPL');
  const [kpiViewMode, setKpiViewMode] = useState<'executive' | 'all'>('all');

  const [kpiData, setKpiData] = useState<KpiSummaryResponse | null>(null);
  const [chartsData, setChartsData] = useState<ChartsDataResponse | null>(null);
  const [tableData, setTableData] = useState<TableSummaryResponse | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0); // Default OFF to prevent unwanted constant refresh
  const [dbError, setDbError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalData, setModalData] = useState<DrilldownResponse | null>(null);
  const [isModalLoading, setIsModalLoading] = useState<boolean>(false);

  const fetchDashboardData = useCallback(async (customFrom?: string, customTo?: string, customOrg?: OrgFilter, isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    const from = customFrom !== undefined ? customFrom : fromDate;
    const to = customTo !== undefined ? customTo : toDate;
    const org = customOrg !== undefined ? customOrg : selectedOrg;

    try {
      const queryParams = new URLSearchParams();
      if (from) queryParams.set('fromDate', from);
      if (to) queryParams.set('toDate', to);
      if (org) queryParams.set('org', org);

      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

      const [kpiRes, chartsRes, tableRes] = await Promise.all([
        fetch(`/api/dashboard/kpi${queryString}`),
        fetch(`/api/dashboard/charts${queryString}`),
        fetch(`/api/dashboard/summary${queryString}`),
      ]);

      if (!kpiRes.ok || !chartsRes.ok || !tableRes.ok) {
        const errorPayload = !kpiRes.ok
          ? await kpiRes.json().catch(() => ({}))
          : (!chartsRes.ok ? await chartsRes.json().catch(() => ({})) : await tableRes.json().catch(() => ({})));
        throw new Error(errorPayload.details || errorPayload.error || 'Failed to retrieve live database records');
      }

      const kpi = await kpiRes.json();
      const charts = await chartsRes.json();
      const table = await tableRes.json();

      setKpiData(kpi);
      setChartsData(charts);
      setTableData(table);
      setDbError(null);
      setLastRefreshed(formatRefreshTime(new Date()));
    } catch (err: any) {
      console.error('Failed to load dashboard metrics from live SQL Server:', err);
      setDbError(err.message || 'Unable to establish read-only connection to Dinesh_Weaving_ERP');
    } finally {
      setIsLoading(false); // ALWAYS release loading spinner
    }
  }, [fromDate, toDate, selectedOrg]);

  useEffect(() => {
    if (fromDate && toDate && fromDate.length === 10 && toDate.length === 10) {
      // 350ms debounce: prevents rapid duplicate queries while user selects or adjusts dates
      const timer = setTimeout(() => {
        fetchDashboardData(fromDate, toDate, selectedOrg);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [fromDate, toDate, selectedOrg, fetchDashboardData]);

  // Configurable Auto-Refresh Synchronizer
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const timer = setInterval(() => {
      fetchDashboardData(fromDate, toDate, selectedOrg, true);
    }, autoRefreshInterval * 1000);
    return () => clearInterval(timer);
  }, [autoRefreshInterval, fromDate, toDate, selectedOrg, fetchDashboardData]);

  const handleApplyFilter = () => {
    fetchDashboardData(fromDate, toDate, selectedOrg);
  };

  const handleResetFilter = () => {
    const today = getLocalDateISO();
    setFromDate(today);
    setToDate(today);
    fetchDashboardData(today, today, selectedOrg);
  };

  const handleOrgChange = (newOrg: OrgFilter) => {
    setSelectedOrg(newOrg);
    fetchDashboardData(fromDate, toDate, newOrg);
  };

  const handlePresetSelect = (preset: 'today' | '7d' | '30d' | 'month') => {
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
    const newFrom = getLocalDateISO(start);
    const newTo = getLocalDateISO(end);
    setFromDate(newFrom);
    setToDate(newTo);
    fetchDashboardData(newFrom, newTo, selectedOrg);
  };

  const handleRefresh = () => {
    fetchDashboardData(fromDate, toDate, selectedOrg);
  };

  const handleOpenDrilldown = async (moduleKey: BusinessModuleKey, date?: string) => {
    setIsModalLoading(true);
    setIsModalOpen(true);

    try {
      const params = new URLSearchParams();
      params.set('module', moduleKey);
      if (selectedOrg) params.set('org', selectedOrg);
      if (date) {
        params.set('date', date);
      } else {
        if (fromDate) params.set('fromDate', fromDate);
        if (toDate) params.set('toDate', toDate);
      }

      const res = await fetch(`/api/dashboard/drilldown?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setModalData(data);
      }
    } catch (err) {
      console.error('Failed to load drilldown ledger:', err);
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleTableRowClick = (date: string, moduleKey?: BusinessModuleKey) => {
    handleOpenDrilldown(moduleKey || 'vendor_inward', date);
  };

  return (
    <div className="min-h-screen bg-[#F7FAFA] text-[#252B2E] flex flex-col font-sans antialiased selection:bg-[#345C64] selection:text-white">

      {/* 1. Modern White Header with Official Logo, Division Switcher & Sleek Controls */}
      <Header
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onApplyFilter={handleApplyFilter}
        onResetFilter={handleResetFilter}
        onPresetSelect={handlePresetSelect}
        selectedOrg={selectedOrg}
        onOrgChange={handleOrgChange}
        kpiViewMode={kpiViewMode}
        onKpiViewModeChange={setKpiViewMode}
        lastRefreshed={lastRefreshed}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        autoRefreshInterval={autoRefreshInterval}
        onAutoRefreshChange={setAutoRefreshInterval}
      />

      {/* Main Content Area - Clean, Focused, No Clutter */}
      <main className="flex-1 max-w-[1780px] w-full mx-auto px-6 pt-2.5 pb-6">

        {/* Real-Time Database Connection Notice / Error Banner */}
        {dbError && (
          <div className="mb-4 p-4 rounded-2xl bg-[#E96F50]/10 border border-[#E96F50]/30 text-[#252B2E] flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#E96F50] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#E96F50]">Database Connection Notice</p>
                <p className="text-xs text-[#252B2E]/80 mt-0.5">{dbError}</p>
              </div>
            </div>
            <button
              onClick={() => fetchDashboardData(fromDate, toDate, selectedOrg)}
              className="bg-[#E96F50] hover:bg-[#d65f41] text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-all"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* 2. Operational Highlights Cards (Clean Executive 4-Point or 7 Modules) */}
        <KpiCards
          data={kpiData}
          onSelectModule={(key) => handleOpenDrilldown(key)}
          isLoading={isLoading}
          viewMode={kpiViewMode}
          onViewModeChange={setKpiViewMode}
        />

        {/* 3. Streamlined Executive Analytics (Smooth Sales Area Chart + Volume Donut) */}
        <AnalyticsCharts
          data={chartsData}
          onChartClick={(moduleKey, date) => handleOpenDrilldown(moduleKey, date)}
          isLoading={isLoading}
        />

        {/* 4. Daily Transaction Summary Table with Clean 6-Col / Full 15-Col Toggle */}
        {tableData && (
          <SummaryTable
            rows={tableData.rows}
            totals={tableData.totals}
            onRowClick={handleTableRowClick}
            isLoading={isLoading}
          />
        )}

      </main>

      {/* 5. Same-Page Interactive Drilldown Modal */}
      <DrilldownModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={modalData}
        isLoading={isModalLoading}
      />

      {/* Executive Clean Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-3.5 px-6 text-center text-xs mt-auto">
        <div className="max-w-[1780px] mx-auto flex flex-wrap items-center justify-between gap-2 text-slate-500 font-medium">
          <div>
            © {new Date().getFullYear()} <strong className="text-[#252B2E] font-bold">Dinesh Exports PVT LTD</strong> <span className="text-[#345C64] font-medium">(The House Of Textiles)</span> | Executive Textile Dashboard
          </div>
        </div>
      </footer>

    </div>
  );
}
