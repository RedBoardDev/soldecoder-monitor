import { ClosedMessagesFeature } from '@soldecoder-monitor/features/src/closed-messages/closed-messages.feature';
import { DonateFeature } from '@soldecoder-monitor/features/src/donate/donate.feature';
import { GlobalPositionsFeature } from '@soldecoder-monitor/features/src/global-positions/global-positions.feature';
import { NftPriceFeature } from '@soldecoder-monitor/features/src/nft-price/nft-price.feature';
import { PositionSizeFeature } from '@soldecoder-monitor/features/src/positions-size/position-size.feature';
import { SettingsChannelsFeature } from '@soldecoder-monitor/features/src/settings-channels/settings-channels.feature';
import { SettingsServerFeature } from '@soldecoder-monitor/features/src/settings-server/settings-server.feature';
import type { Feature } from '@soldecoder-monitor/features-sdk';
import { GatewayIntentBits, Partials } from 'discord.js';

/**
 * Discord Bot Configuration
 */
export const botConfig = {
  /**
   * Discord client intents
   */
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ] as const,

  /**
   * Discord client partials
   */
  partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User, Partials.GuildMember] as const,

  /**
   * Features to load
   */
  features: [
    { name: 'DonateFeature', class: DonateFeature },
    { name: 'NftPriceFeature', class: NftPriceFeature },
    { name: 'PositionSizeFeature', class: PositionSizeFeature },
    { name: 'GlobalPositionsFeature', class: GlobalPositionsFeature },
    { name: 'SettingsChannelsFeature', class: SettingsChannelsFeature },
    { name: 'SettingsServerFeature', class: SettingsServerFeature },
    { name: 'ClosedMessagesFeature', class: ClosedMessagesFeature },
  ] as Array<{ name: string; class: new () => Feature }>,

  /**
   * Help command configuration
   */
  helpCommand: {
    enabled: true,
    commandName: 'help',
  },

  /**
   * Global bot configuration
   */
  global: {
    logLevel: 'debug' as const,
  },
} as const;

export type BotConfig = typeof botConfig;
