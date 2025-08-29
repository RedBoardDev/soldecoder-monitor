import type { Client } from 'discord.js';
import type { FeatureContext, Logger } from '../types';

/**
 * Create a feature context
 * @param client - Discord.js client instance
 * @param logger - Logger instance
 * @param config - Feature-specific configuration
 * @returns Feature context object
 */
export function createFeatureContext(
  client: Client,
  logger: Logger,
  config: Record<string, unknown> = {},
): FeatureContext {
  return {
    client,
    logger,
    config: Object.freeze(config), // Prevent accidental mutations
  };
}
