import type { LpAgentOverviewData } from '@shared/discord/types/lpagent.types';
import type { LpAgentPeriodData, SummaryData } from '../../domain/types/summary-data.types';
import type { SummaryContextVO } from '../../domain/value-objects/summary-context.vo';

/**
 * Extract summary data from LpAgent overview based on summary context
 */
export function extractSummaryData(overview: LpAgentOverviewData, context: SummaryContextVO): SummaryData {
  const periodData: LpAgentPeriodData = {
    total_pnl: overview.total_pnl,
    total_pnl_native: overview.total_pnl_native,
    win_rate_native: overview.win_rate_native,
    total_fee_native: overview.total_fee_native,
    closed_lp: overview.closed_lp,
    avg_inflow_native: overview.avg_inflow_native,
    expected_value_native: overview.expected_value_native,
  };

  const extractedData = context.extractPeriodData(periodData);

  return {
    totalPnl: extractedData.total_pnl,
    totalPnlNative: extractedData.total_pnl_native,
    winRateNative: extractedData.win_rate_native,
    totalFeeNative: extractedData.total_fee_native,
    closedLp: extractedData.closed_lp,
    avgInflowNative: extractedData.avg_inflow_native,
    expectedValueNative: extractedData.expected_value_native,
    avgMonthlyPnlNative: extractedData.avg_monthly_pnl_native,
    avgMonthlyInflowNative: extractedData.avg_monthly_inflow_native,
  };
}
