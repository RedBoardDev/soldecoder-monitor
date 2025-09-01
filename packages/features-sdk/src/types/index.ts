// framework/types/index.ts
import type {
  AutocompleteInteraction,
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  ChatInputCommandInteraction,
  Client,
  ClientEvents,
  PermissionResolvable as DiscordPermissionResolvable,
  MentionableSelectMenuInteraction,
  MessageContextMenuCommandInteraction,
  ModalSubmitInteraction,
  RoleSelectMenuInteraction,
  SlashCommandBuilder,
  StringSelectMenuInteraction,
  UserContextMenuCommandInteraction,
  UserSelectMenuInteraction,
} from 'discord.js';

export type PermissionResolvable = DiscordPermissionResolvable;

// ============= Core Types =============

export interface FeatureMetadata {
  name: string;
  version: string;
  description?: string;
  category?: string;
  enabled?: boolean;
}

export interface FeatureContext {
  client: Client;
  logger: Logger;
  config: Record<string, unknown>;
}

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, error?: Error | unknown): void;
}

// ============= Command Types =============

export interface CommandDocumentation {
  category?: string;
  adminOnly?: boolean;
  description?: string;
  detailedDescription?: string;
  usage?: string;
  examples?: string[];
  permissions?: PermissionResolvable[];
  cooldown?: number;
  guildOnly?: boolean;
}

export interface SlashCommandMetadata {
  name: string;
  description: string;
  docs?: CommandDocumentation;
  builder?: (builder: SlashCommandBuilder) => SlashCommandBuilder;
  ephemeral?: boolean;
}

export interface UserCommandMetadata {
  name: string;
  docs?: CommandDocumentation;
  ephemeral?: boolean;
}

export interface MessageCommandMetadata {
  name: string;
  docs?: CommandDocumentation;
  ephemeral?: boolean;
}

// ============= Interaction Types =============

export interface ButtonHandlerMetadata {
  customId: string | RegExp;
  persistent?: boolean; // Si true, survit aux redémarrages
}

export interface SelectHandlerMetadata {
  customId: string | RegExp;
  type?: 'string' | 'user' | 'role' | 'channel' | 'mentionable';
  persistent?: boolean;
}

export interface ModalHandlerMetadata {
  customId: string | RegExp;
  persistent?: boolean;
}

export interface AutocompleteHandlerMetadata {
  commandName: string;
  optionName?: string;
}

// ============= Event Types =============

export interface EventMetadata {
  event: keyof ClientEvents;
  once?: boolean;
}

// ============= Scheduler Types =============

export interface CronMetadata {
  name: string;
  pattern: string; // Cron expression
  timezone?: string;
  runOnInit?: boolean;
}

export interface IntervalMetadata {
  name: string;
  milliseconds: number;
  runOnInit?: boolean;
}

// ============= Guard Types =============

export interface GuardContext {
  interaction: ChatInputCommandInteraction | ButtonInteraction | StringSelectMenuInteraction | any;
  client: Client;
  featureName: string;
  methodName: string;
}

export interface Guard {
  canActivate(context: GuardContext): boolean | Promise<boolean>;
  onFail?(context: GuardContext): void | Promise<void>;
}

export interface RateLimitOptions {
  max: number;
  window: number; // en ms
  scope?: 'user' | 'guild' | 'channel' | 'global';
  message?: string;
}

// ============= Handler Types =============

export type CommandHandler = (interaction: ChatInputCommandInteraction) => Promise<void>;
export type UserCommandHandler = (interaction: UserContextMenuCommandInteraction) => Promise<void>;
export type MessageCommandHandler = (interaction: MessageContextMenuCommandInteraction) => Promise<void>;
export type ButtonHandler = (interaction: ButtonInteraction) => Promise<void>;
export type SelectHandler = (
  interaction:
    | StringSelectMenuInteraction
    | UserSelectMenuInteraction
    | RoleSelectMenuInteraction
    | ChannelSelectMenuInteraction
    | MentionableSelectMenuInteraction,
) => Promise<void>;
export type ModalHandler = (interaction: ModalSubmitInteraction) => Promise<void>;
export type AutocompleteHandler = (interaction: AutocompleteInteraction) => Promise<void>;
export type EventHandler = (...args: any[]) => Promise<void>;
export type SchedulerHandler = () => Promise<void>;

// ============= Registry Types =============

export interface CommandRegistration {
  feature: string;
  method: string;
  metadata: SlashCommandMetadata | UserCommandMetadata | MessageCommandMetadata;
  guards: Guard[];
  handler: Function;
}

export interface InteractionRegistration {
  feature: string;
  method: string;
  pattern: string | RegExp;
  guards: Guard[];
  handler: Function;
  persistent: boolean;
}

export interface EventRegistration {
  feature: string;
  method: string;
  event: keyof ClientEvents;
  once: boolean;
  handler: Function;
}

export interface SchedulerRegistration {
  feature: string;
  method: string;
  pattern?: string; // Pour cron
  interval?: number; // Pour interval
  runOnInit: boolean;
  handler: Function;
  job?: any; // node-cron job ou setTimeout
}
