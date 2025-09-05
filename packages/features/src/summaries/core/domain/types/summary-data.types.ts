/**
 * Summary data extracted from LpAgent overview for a specific period
 */
export interface SummaryData {
  totalPnl: number;
  totalPnlNative: number;
  winRateNative: number;
  totalFeeNative: number;
  closedLp: number;
  avgInflowNative: number;
  expectedValueNative: number;
  avgMonthlyPnlNative: number;
  avgMonthlyInflowNative: number;
}

/**
 * Raw LpAgent overview data structure for period extraction
 */
export interface LpAgentPeriodData {
  total_pnl: { '7D': number; '1M': number };
  total_pnl_native: { '7D': number; '1M': number };
  win_rate_native: { '7D': number; '1M': number };
  total_fee_native: { '7D': number; '1M': number };
  closed_lp: { '7D': number; '1M': number };
  avg_inflow_native: { '7D': number; '1M': number };
  expected_value_native: { '7D': number; '1M': number };
}
