import type { Client } from 'discord.js';

/**
 * Plugin metadata interface
 */
export interface IPluginMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: string[];
}

/**
 * Plugin lifecycle hooks
 */
export interface IPluginLifecycle {
  /**
   * Called when plugin is loaded
   */
  onLoad?(context: IPluginContext): Promise<void> | void;

  /**
   * Called when plugin is enabled
   */
  onEnable?(context: IPluginContext): Promise<void> | void;

  /**
   * Called when plugin is disabled
   */
  onDisable?(): Promise<void> | void;

  /**
   * Called when plugin is unloaded
   */
  onUnload?(): Promise<void> | void;
}

/**
 * Plugin context provided to plugins
 */
export interface IPluginContext {
  client: Client;
  logger: ILogger;
  config: IPluginConfig;
}

/**
 * Plugin configuration interface
 */
export interface IPluginConfig {
  enabled: boolean;
  [key: string]: unknown;
}

/**
 * Logger interface for plugins
 */
export interface ILogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, error?: Error | unknown): void;
}

/**
 * Base plugin interface
 */
export interface IPlugin extends IPluginLifecycle {
  metadata: IPluginMetadata;
}

/**
 * Scheduler metadata
 */
export interface ISchedulerMetadata {
  name: string;
  cron?: string; // Cron expression (e.g., "0 */5 * * * *" every 5 minutes)
  interval?: number; // Interval in milliseconds
  immediate?: boolean; // Run immediately on start
  enabled?: boolean; // Can be disabled
}

/**
 * Scheduler manager interface
 */
export interface ISchedulerManager {
  schedule(name: string, metadata: ISchedulerMetadata, handler: () => Promise<void>): void;
  unschedule(name: string): void;
  isScheduled(name: string): boolean;
  getSchedules(): Map<string, { metadata: ISchedulerMetadata; isRunning: boolean }>;
}
