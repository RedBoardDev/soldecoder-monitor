import { z } from 'zod';

/**
 * Channel Settings Domain Types
 */

export const channelInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type ChannelInfo = z.infer<typeof channelInfoSchema>;

export const guildChannelsListSchema = z.object({
  guildId: z.string(),
  channels: z.array(channelInfoSchema),
});

export type GuildChannelsList = z.infer<typeof guildChannelsListSchema>;

export const channelSettingsOverviewSchema = z.object({
  guildId: z.string(),
  channelConfigs: z.array(z.any()), // ChannelConfigEntity array
  availableChannels: z.array(channelInfoSchema),
  totalConfigured: z.number(),
});

export type ChannelSettingsOverview = z.infer<typeof channelSettingsOverviewSchema>;

/**
 * Add Channel Operation Types
 */
export const addChannelRequestSchema = z.object({
  channelId: z.string().min(1),
  guildId: z.string().min(1),
});

export type AddChannelRequest = z.infer<typeof addChannelRequestSchema>;

/**
 * Remove Channel Operation Types
 */
export const removeChannelRequestSchema = z.object({
  channelId: z.string().min(1),
});

export type RemoveChannelRequest = z.infer<typeof removeChannelRequestSchema>;
