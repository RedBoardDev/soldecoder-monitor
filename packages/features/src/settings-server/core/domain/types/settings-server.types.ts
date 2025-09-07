import { z } from 'zod';

/**
 * Server Settings Overview Schema
 */
export const serverSettingsOverviewSchema = z.object({
  guildId: z.string(),
  positionDisplayEnabled: z.boolean(),
  globalChannelId: z.string().nullable(),
  globalChannelName: z.string().optional(),
  forward: z.boolean(),
  positionSizeDefaults: z.object({
    walletAddress: z.string().nullable(),
    stopLossPercent: z.number().nullable(),
  }),
});

/**
 * Server Settings Update Schema
 */
export const serverSettingsUpdateSchema = z.object({
  positionDisplayEnabled: z.boolean().optional(),
  globalChannelId: z.string().nullable().optional(),
  forward: z.boolean().optional(),
  positionSizeDefaults: z
    .object({
      walletAddress: z.string().nullable().optional(),
      stopLossPercent: z.number().nullable().optional(),
    })
    .optional(),
});

export type ServerSettingsOverview = z.infer<typeof serverSettingsOverviewSchema>;
export type ServerSettingsUpdate = z.infer<typeof serverSettingsUpdateSchema>;
