import { z } from 'zod';
import {
  type StopLossTrigger,
  StopLossTriggerSchema,
  type TakeProfitTrigger,
  TakeProfitTriggerSchema,
  type TriggerData,
} from '../../domain/types/trigger.types';

/**
 * Parses a "Take profit triggered" message and extracts:
 * - profitPct: the profit percentage (e.g. 5.39)
 * - thresholdPct: the threshold percentage that was exceeded (e.g. 1)
 */
export function parseTakeProfitTrigger(content: string): z.SafeParseReturnType<TakeProfitTrigger, TakeProfitTrigger> {
  const regex = /Take profit triggered:\s*([\d.]+)% profit exceeds\s*([\d.]+)% threshold/;
  const match = content.match(regex);

  if (!match) {
    return {
      success: false,
      error: z.ZodError.create([
        {
          code: z.ZodIssueCode.custom,
          message: 'Not a valid take-profit trigger message',
          path: [],
        },
      ]),
    };
  }

  const [, profit, threshold] = match;
  const data = {
    profitPct: Number(profit),
    thresholdPct: Number(threshold),
  };

  return TakeProfitTriggerSchema.safeParse(data);
}

/**
 * Parses a "Stop loss triggered" message and extracts:
 * - lossPct: the loss percentage (e.g. 2.5)
 * - thresholdPct: the threshold percentage that was exceeded (e.g. 1)
 */
export function parseStopLossTrigger(content: string): z.SafeParseReturnType<StopLossTrigger, StopLossTrigger> {
  const regex = /Stop loss triggered:\s*([\d.]+)% loss exceeds\s*([\d.]+)% threshold/;
  const match = content.match(regex);

  if (!match) {
    return {
      success: false,
      error: z.ZodError.create([
        {
          code: z.ZodIssueCode.custom,
          message: 'Not a valid stop-loss trigger message',
          path: [],
        },
      ]),
    };
  }

  const [, loss, threshold] = match;
  const data = {
    lossPct: Number(loss),
    thresholdPct: Number(threshold),
  };

  return StopLossTriggerSchema.safeParse(data);
}

/**
 * Main parser function that attempts to parse any trigger message
 * Returns the parsed trigger data or null if no valid trigger found
 */
export function parseTriggerMessage(content: string): TriggerData | null {
  const takeProfitResult = parseTakeProfitTrigger(content);
  if (takeProfitResult.success) {
    return { type: 'take_profit', data: takeProfitResult.data };
  }

  const stopLossResult = parseStopLossTrigger(content);
  if (stopLossResult.success) {
    return { type: 'stop_loss', data: stopLossResult.data };
  }

  return null;
}
