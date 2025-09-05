import { z } from 'zod';

/**
 * Schema for take profit trigger data
 */
export const TakeProfitTriggerSchema = z.object({
  profitPct: z.number(),
  thresholdPct: z.number(),
});

/**
 * Schema for stop loss trigger data
 */
export const StopLossTriggerSchema = z.object({
  lossPct: z.number(),
  thresholdPct: z.number(),
});

/**
 * Schema for complete trigger data
 */
export const TriggerDataSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('take_profit'),
    data: TakeProfitTriggerSchema,
  }),
  z.object({
    type: z.literal('stop_loss'),
    data: StopLossTriggerSchema,
  }),
]);

export type TriggerData = z.infer<typeof TriggerDataSchema>;
export type TakeProfitTrigger = z.infer<typeof TakeProfitTriggerSchema>;
export type StopLossTrigger = z.infer<typeof StopLossTriggerSchema>;

/**
 * Schema for final position data structure (compatible with old system)
 */
export const FinalPositionDataSchema = z.object({
  metadata: z.object({
    pair_name: z.string(),
    duration_hours: z.number(),
  }),
  performance: z.object({
    pnl_percentage: z.number(),
    net_result: z.object({
      sol: z.number(),
      usd: z.number(),
    }),
    tvl: z.object({
      sol: z.number(),
      usd: z.number(),
    }),
  }),
});

export type FinalPositionData = z.infer<typeof FinalPositionDataSchema>;
