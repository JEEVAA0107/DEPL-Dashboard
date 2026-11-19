// Utility formatters for enterprise textile ERP reporting

/**
 * Format numbers with Indian numbering system or standard commas
 * e.g., 1450250.5 -> "14,50,250.50"
 */
export function formatMeters(value: number | null | undefined, includeUnit = false): string {
  if (value === null || value === undefined || isNaN(value)) {
    return includeUnit ? "0.00 Mtr" : "0.00";
  }
  
  // Format with 2 decimal places and standard Indian/international grouping
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);

  return includeUnit ? `${formatted} Mtr` : formatted;
}

/**
 * Format document / order counts as integer
 */
export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "0";
  return new Intl.NumberFormat('en-IN').format(value);
}

/**
 * Format Date to standard ERP string: "18-Nov-2026"
 */
export function formatErpDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
}

/**
 * Format Date to ISO Input value: "YYYY-MM-DD"
 */
export function formatInputDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get current time string in 12-hour AM/PM format
 */
export function formatRefreshTime(date: Date = new Date()): string {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const strHours = String(hours).padStart(2, '0');
  return `${strHours}:${minutes}:${seconds} ${ampm}`;
}

/**
 * Calculate percentage change
 */
export function calcPercentageChange(current: number, previous: number): number {
  if (!previous || previous === 0) return 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}
