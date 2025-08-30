import { DonateFeature } from '@soldecoder-monitor/features/src/donate/donate.feature';
import { EchoFeature } from '@soldecoder-monitor/features/src/echo/echo.feature';
import { PingFeature } from '@soldecoder-monitor/features/src/ping/ping.feature';
import { SchedulerFeature } from '@soldecoder-monitor/features/src/scheduler/scheduler.feature';
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
    { name: 'PingFeature', class: PingFeature },
    { name: 'EchoFeature', class: EchoFeature },
    { name: 'SchedulerFeature', class: SchedulerFeature },
    { name: 'DonateFeature', class: DonateFeature },
  ] as Array<{ name: string; class: new () => Feature }>,

  /**
   * Global bot configuration
   */
  global: {
    logLevel: 'debug' as const,
  },
} as const;

export type BotConfig = typeof botConfig;
