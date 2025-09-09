import { z } from 'zod';

export const SummaryDataSchema = z.object({
  totalPnl: z.number(),
  totalPnlNative: z.number(),
  winRateNative: z.number(),
  totalFeeNative: z.number(),
  closedLp: z.number(),
  avgInflowNative: z.number(),
  expectedValueNative: z.number(),
  avgMonthlyPnlNative: z.number(),
  avgMonthlyInflowNative: z.number(),
  netWorth: z.number(),
});

export type SummaryData = z.infer<typeof SummaryDataSchema>;

export interface LpAgentPeriodData {
  total_pnl: { '7D': number; '1M': number };
  total_pnl_native: { '7D': number; '1M': number };
  win_rate_native: { '7D': number; '1M': number };
  total_fee_native: { '7D': number; '1M': number };
  closed_lp: { '7D': number; '1M': number };
  avg_inflow_native: { '7D': number; '1M': number };
  expected_value_native: { '7D': number; '1M': number };
}
