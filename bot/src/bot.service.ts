import { config, validateEnvironment } from '@soldecoder-monitor/config-env';
import { FeatureManager } from '@soldecoder-monitor/features-sdk';
import { logger, setLogLevel } from '@soldecoder-monitor/logger';
import { Client } from 'discord.js';
import { botConfig } from './config/bot.config';
import type { BotDependencies, BotInitResult, FeatureConfig } from './types';

/**
 * Bot Service - Handles Discord bot lifecycle and feature management
 */
export class BotService {
  private dependencies?: BotDependencies;

  /**
   * Initialize the bot with all its dependencies
   */
  async initialize(): Promise<BotInitResult> {
    try {
      // Validate environment
      validateEnvironment();
      setLogLevel(botConfig.global.logLevel);
      logger.info('✅ Environment configuration loaded');

      // Create Discord client
      const client = new Client({
        intents: botConfig.intents,
        partials: botConfig.partials,
      });

      // Create feature manager
      const featureManager = new FeatureManager({
        client,
        logger,
        globalConfig: {
          environment: process.env.NODE_ENV || 'development',
        },
        helpCommand: botConfig.helpCommand,
      });

      // Store dependencies
      this.dependencies = { client, featureManager, logger };

      // Setup event handlers
      this.setupEventHandlers();

      // Load features
      const featuresResult = await this.loadFeatures(botConfig.features);

      // Initialize feature manager (must be before login to register help command)
      await featureManager.initialize();

      // Login to Discord
      await client.login(config.discord.token);

      logger.info('🚀 Bot is now running!');

      return {
        success: true,
        featuresLoaded: featuresResult.loaded,
        errors: featuresResult.errors.length > 0 ? featuresResult.errors : undefined,
      };
    } catch (error) {
      logger.error('❌ Failed to initialize bot:', error);
      return {
        success: false,
        featuresLoaded: 0,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  /**
   * Gracefully shutdown the bot
   */
  async shutdown(signal?: string): Promise<void> {
    if (!this.dependencies) return;

    const { client, featureManager, logger } = this.dependencies;

    if (signal) {
      logger.info(`Received ${signal}, initiating graceful shutdown...`);
    }

    try {
      await featureManager.shutdown();
      client.destroy();
      logger.info('✅ Bot stopped successfully');
    } catch (error) {
      logger.error('Error during shutdown:', error);
      throw error;
    }
  }

  /**
   * Get bot dependencies (for external access if needed)
   */
  getDependencies(): BotDependencies | undefined {
    return this.dependencies;
  }

  /**
   * Setup Discord client event handlers
   */
  private setupEventHandlers(): void {
    if (!this.dependencies) return;

    const { client, featureManager, logger } = this.dependencies;

    // Ready event
    client.once('ready', async (readyClient) => {
      if (!readyClient.user) return;

      logger.info(`🤖 Bot logged in as ${readyClient.user.tag}`);
      logger.info(`📊 Serving ${readyClient.guilds.cache.size} guilds`);
      logger.info(`🔌 ${featureManager.getFeatures().size} features loaded`);

      // Sync commands with Discord
      try {
        await featureManager.syncCommands();
        logger.info('✅ Commands synced successfully');
      } catch (error) {
        logger.error('Failed to sync commands:', error);
      }
    });

    // Error handling
    client.on('error', (error) => {
      logger.error('Discord client error:', error);
    });

    client.on('warn', (info) => {
      logger.warn('Discord client warning:', info);
    });
  }

  /**
   * Load and register all features
   */
  private async loadFeatures(features: FeatureConfig[]): Promise<{ loaded: number; errors: string[] }> {
    if (!this.dependencies) throw new Error('Bot not initialized');

    const { featureManager, logger } = this.dependencies;
    const errors: string[] = [];
    let loaded = 0;

    logger.info('📦 Loading features...');

    for (const { name, class: FeatureClass } of features) {
      try {
        logger.info(`📝 Registering feature: ${name}`);
        await featureManager.registerFeature(FeatureClass);
        logger.info(`✅ Loaded feature: ${name}`);
        loaded++;
      } catch (error) {
        const errorMessage = `Failed to load feature ${name}: ${error instanceof Error ? error.message : String(error)}`;
        logger.error(`❌ ${errorMessage}`);
        errors.push(errorMessage);
      }
    }

    logger.info(`📊 Total features loaded: ${loaded}`);

    if (errors.length > 0) {
      logger.warn(`⚠️ ${errors.length} feature(s) failed to load`);
    }

    return { loaded, errors };
  }

  /**
   * Setup process signal handlers for graceful shutdown
   */
  setupSignalHandlers(): void {
    const shutdownHandler = async (signal: string) => {
      try {
        await this.shutdown(signal);
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdownHandler('SIGINT'));
    process.on('SIGTERM', () => shutdownHandler('SIGTERM'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled promise rejection:', reason);
      process.exit(1);
    });
  }
}
