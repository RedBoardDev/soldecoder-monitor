import { DonateFeature } from '@soldecoder-monitor/features/src/donate/donate.feature';
import { NftPriceFeature } from '@soldecoder-monitor/features/src/nft-price/nft-price.feature';
import { PositionSizeFeature } from '@soldecoder-monitor/features/src/positions-size/position-size.feature';
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
  ] as Array<{ name: string; class: new () => Feature }>,

  /**
   * Global bot configuration
   */
  global: {
    logLevel: 'debug' as const,
  },
} as const;

export type BotConfig = typeof botConfig;
