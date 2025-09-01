import { DiscordZodTypes } from '@soldecoder-monitor/discord';
import { z } from 'zod';
import type { PositionStatus } from '../value-objects/position-status.vo';

// Discord Command Options
export const globalPositionsOptionsSchema = z.object({
  percent_only: DiscordZodTypes.boolean().nullable(),
});

export type GlobalPositionsOptions = z.infer<typeof globalPositionsOptionsSchema>;

// Position Status Schema & Types
export const PositionStatusSchema = z.object({
  walletName: z.string(),
  symbolShort: z.string(),
  status: z.enum(['profit', 'loss', 'neutral']),
  pnl: z.number(),
  pnlPercentage: z.number(),
  startPrice: z.number(),
  currentPrice: z.number(),
  unclaimedFees: z.number(),
  claimedFees: z.number(),
});

export type PositionStatusData = z.infer<typeof PositionStatusSchema>;

// Embed Params
export interface GlobalPositionsEmbedParams {
  positionsByWallet: Map<string, PositionStatus[]>;
  percentOnly: boolean;
  footerText?: string;
  updateId?: string;
}
