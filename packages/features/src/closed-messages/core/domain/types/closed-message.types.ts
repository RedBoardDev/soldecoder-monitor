import { z } from 'zod';

/**
 * Schema for Metlex link in closed messages
 */
export const MetlexLinkSchema = z.object({
  url: z.string().url('Invalid Metlex URL format'),
  hash: z.string().min(1, 'Hash is required'),
});

/**
 * Schema for parsed Metlex message data from closed position
 */
export const ClosedMessageDataSchema = z.object({
  walletPrefix: z.string().min(1, 'Wallet prefix is required'),
  positionHashes: z
    .array(z.string().min(1, 'Position hash is required'))
    .min(1, 'At least one position hash is required'),
  positionIds: z.array(z.string().min(1, 'Position ID is required')).min(1, 'At least one position ID is required'),
  links: z.array(MetlexLinkSchema).min(1, 'At least one Metlex link is required'),
});

/**
 * Schema for closed message processing options
 */
export const ClosedMessageOptionsSchema = z.object({
  pnlThreshold: z.number().min(0, 'PnL threshold must be positive'),
  shouldNotify: z.boolean(),
  shouldPin: z.boolean(),
  shouldGenerateImage: z.boolean(),
  tagId: z.string().optional(),
  tagType: z.enum(['USER', 'ROLE', 'NONE']).optional(),
});

/**
 * Schema for historical position data from LpAgent
 */
export const HistoricalPositionDataSchema = z.object({
  walletAddress: z.string().min(1, 'Wallet address is required'),
  pnlPercentage: z.number(),
  positionAddress: z.string().min(1, 'Position address is required'),
  tokenSymbol: z.string().min(1, 'Token symbol is required'),
  startValue: z.number().min(0, 'Start value must be positive'),
  currentValue: z.number().min(0, 'Current value must be positive'),
  fees: z.number().min(0, 'Fees must be positive'),
});

export type MetlexLink = z.infer<typeof MetlexLinkSchema>;
export type ClosedMessageData = z.infer<typeof ClosedMessageDataSchema>;
export type ClosedMessageOptions = z.infer<typeof ClosedMessageOptionsSchema>;
export type HistoricalPositionData = z.infer<typeof HistoricalPositionDataSchema>;
