import type { Feature, FeatureManager } from '@soldecoder-monitor/features-sdk';
import type { Logger } from '@soldecoder-monitor/logger';
import type { Client } from 'discord.js';

/**
 * Bot dependencies container
 */
export interface BotDependencies {
  client: Client;
  featureManager: FeatureManager;
  logger: Logger;
}

/**
 * Feature registration configuration
 */
export interface FeatureConfig {
  name: string;
  class: new () => Feature;
}

/**
 * Bot initialization result
 */
export interface BotInitResult {
  success: boolean;
  featuresLoaded: number;
  errors?: string[];
}
