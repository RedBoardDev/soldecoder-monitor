import type { LpAgentOverviewData } from '@shared/discord/types/lpagent.types';
import type { LpAgentPeriodData, SummaryData } from '../../domain/types/summary-data.types';
import type { SummaryContextVO } from '../../domain/value-objects/summary-context.vo';

export function extractSummaryData(
  overview: LpAgentOverviewData,
  context: SummaryContextVO,
  netWorth: number,
): SummaryData {
  const periodData: LpAgentPeriodData = {
    total_pnl: overview.total_pnl,
    total_pnl_native: overview.total_pnl_native,
    win_rate_native: overview.win_rate_native,
    total_fee_native: overview.total_fee_native,
    closed_lp: overview.closed_lp,
    avg_inflow_native: overview.avg_inflow_native,
    expected_value_native: overview.expected_value_native,
  };

  const extractedData = context.extractPeriodData(
    periodData as unknown as Record<string, { '7D': number; '1M': number }>,
  );

  return {
    totalPnl: extractedData.total_pnl || 0,
    totalPnlNative: extractedData.total_pnl_native || 0,
    winRateNative: extractedData.win_rate_native || 0,
    totalFeeNative: extractedData.total_fee_native || 0,
    closedLp: extractedData.closed_lp || 0,
    avgInflowNative: extractedData.avg_inflow_native || 0,
    expectedValueNative: extractedData.expected_value_native || 0,
    avgMonthlyPnlNative: overview.avg_monthly_pnl_native || 0,
    avgMonthlyInflowNative: overview.avg_monthly_inflow_native || 0,
    netWorth,
  };
}
