import type { IFeature } from '@soldecoder-monitor/features-sdk';
import { logger } from '@soldecoder-monitor/logger';
import { Client, GatewayIntentBits } from 'discord.js';
import { config } from '../config/bot.config';
import { FeatureManager } from './feature-manager';

/**
 * Main Discord bot class
 */
export class Bot {
  private client: Client;
  private featureManager: FeatureManager;
  private isRunning = false;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.featureManager = new FeatureManager(this.client);
    this.setupEventHandlers();
  }

  /**
   * Setup Discord client event handlers
   */
  private setupEventHandlers(): void {
    this.client.once('ready', async () => {
      if (!this.client.user) return;

      logger.info(`🤖 Bot logged in as ${this.client.user.tag}`);
      logger.info(`📊 Serving ${this.client.guilds.cache.size} guilds`);
      logger.info(`🔌 ${this.featureManager.getFeatures().size} features loaded`);

      // Sync commands with Discord
      try {
        await this.featureManager.syncCommands();
      } catch (error) {
        logger.error('Failed to sync commands:', error);
      }

      // Start all schedulers now that bot is ready
      this.featureManager.getSchedulerManager().setReady();
    });

    this.client.on('error', (error) => {
      logger.error('Discord client error:', error);
    });

    this.client.on('warn', (info) => {
      logger.warn('Discord client warning:', info);
    });
  }

  /**
   * Register a plugin
   */
  async registerFeature(feature: IFeature): Promise<void> {
    await this.featureManager.registerFeature(feature);
  }

  /**
   * Start the bot
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Bot is already running');
      return;
    }

    try {
      logger.info('🚀 Starting Discord bot...');
      await this.client.login(config.discord.token);
      this.isRunning = true;
      logger.info('✅ Bot started successfully');
    } catch (error) {
      logger.error('❌ Failed to start bot:', error);
      throw error;
    }
  }

  /**
   * Stop the bot
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Bot is not running');
      return;
    }

    try {
      logger.info('🛑 Stopping Discord bot...');

      // Shutdown feature manager (stops schedulers and disables features)
      await this.featureManager.shutdown();

      // Destroy Discord client
      await this.client.destroy();
      this.isRunning = false;

      logger.info('✅ Bot stopped successfully');
    } catch (error) {
      logger.error('❌ Error stopping bot:', error);
      throw error;
    }
  }

  /**
   * Get the Discord client
   */
  getClient(): Client {
    return this.client;
  }

  /**
   * Get the plugin manager
   */
  getFeatureManager(): FeatureManager {
    return this.featureManager;
  }
}
