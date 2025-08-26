import type { IFeature, IFeatureConfig, IFeatureContext } from '@soldecoder-monitor/features-sdk';
import { createFeatureLogger, logger } from '@soldecoder-monitor/logger';
import type { Client } from 'discord.js';
import { SlashCommandBuilder } from 'discord.js';
import { SchedulerManager } from './scheduler-manager';

/**
 * Feature instance with metadata
 */
interface FeatureInstance {
  feature: IFeature;
  enabled: boolean;
  config: IFeatureConfig;
}

/**
 * Feature manager class
 */
export class FeatureManager {
  private features: Map<string, FeatureInstance> = new Map();
  private client: Client;
  private commands: Map<string, SlashCommandBuilder> = new Map();
  private schedulerManager: SchedulerManager;

  constructor(client: Client) {
    this.client = client;
    this.schedulerManager = new SchedulerManager();
  }

  /**
   * Register a feature
   */
  async registerFeature(feature: IFeature, config?: Partial<IFeatureConfig>): Promise<void> {
    if (!feature.metadata) {
      throw new Error(`Feature ${feature.constructor.name} has no metadata. Did you forget the @Feature decorator?`);
    }
    const featureName = feature.metadata.name;

    if (this.features.has(featureName)) {
      throw new Error(`Feature ${featureName} is already registered`);
    }

    const featureConfig: IFeatureConfig = {
      enabled: true,
      ...config,
    };

    const context = this.createFeatureContext(featureName, featureConfig);

    // Load the feature
    if (feature.onLoad) {
      await feature.onLoad(context);
    }

    // Store feature instance
    this.features.set(featureName, {
      feature,
      enabled: false, // Start disabled, will be enabled below
      config: featureConfig,
    });

    // Enable if configured
    if (featureConfig.enabled) {
      await this.enableFeature(featureName);
    }

    logger.info(`Registered feature: ${featureName} v${feature.metadata.version}`);
  }

  /**
   * Enable a feature
   */
  async enableFeature(featureName: string): Promise<void> {
    const instance = this.features.get(featureName);

    if (!instance) {
      throw new Error(`Feature ${featureName} not found`);
    }

    if (instance.enabled) {
      logger.warn(`Feature ${featureName} is already enabled`);
      return;
    }

    const context = this.createFeatureContext(featureName, instance.config);

    // Call onEnable hook
    if (instance.feature.onEnable) {
      await instance.feature.onEnable(context);
    }

    // Register commands
    this.registerFeatureCommands(instance.feature);

    // Register events
    this.registerFeatureEvents(instance.feature);

    // Register schedulers
    this.registerFeatureSchedulers(instance.feature);

    instance.enabled = true;
    logger.info(`Enabled feature: ${featureName}`);
  }

  /**
   * Disable a feature
   */
  async disableFeature(featureName: string): Promise<void> {
    const instance = this.features.get(featureName);

    if (!instance) {
      throw new Error(`Feature ${featureName} not found`);
    }

    if (!instance.enabled) {
      logger.warn(`Feature ${featureName} is already disabled`);
      return;
    }

    // Call onDisable hook
    if (instance.feature.onDisable) {
      await instance.feature.onDisable();
    }

    // TODO: Unregister commands and events

    instance.enabled = false;
    logger.info(`Disabled feature: ${featureName}`);
  }

  /**
   * Get all registered features
   */
  getFeatures(): Map<string, FeatureInstance> {
    return new Map(this.features);
  }

  /**
   * Create feature context
   */
  private createFeatureContext(featureName: string, config: IFeatureConfig): IFeatureContext {
    return {
      client: this.client,
      logger: createFeatureLogger(featureName),
      config,
    };
  }

  /**
   * Register feature commands
   */
  private registerFeatureCommands(feature: IFeature): void {
    const commands = (feature as { commands?: Map<string, unknown> }).commands || new Map();

    logger.info(`[DEBUG] Found ${commands.size} commands for feature ${feature.metadata.name}`);

    for (const [methodName, metadata] of commands) {
      logger.info(`Registering command ${metadata.name} from feature ${feature.metadata.name} (method: ${methodName})`);

      // Create slash command builder
      const builder = new SlashCommandBuilder().setName(metadata.name).setDescription(metadata.description);

      // Apply custom builder if provided
      if (metadata.builder) {
        metadata.builder(builder);
      }

      // Store command for later registration
      this.commands.set(metadata.name, builder);

      // Store command handler
      this.client.on('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (interaction.commandName !== metadata.name) return;

        try {
          await (feature as { [key: string]: (interaction: unknown) => Promise<void> })[methodName](interaction);
        } catch (error) {
          logger.error(`Error executing command ${metadata.name}:`, error);
        }
      });
    }
  }

  /**
   * Sync commands with Discord
   */
  async syncCommands(): Promise<void> {
    try {
      const commandData = Array.from(this.commands.values()).map((cmd) => cmd.toJSON());

      if (this.client.application) {
        await this.client.application.commands.set(commandData);
        logger.info(`Synchronized ${commandData.length} commands with Discord`);
      }
    } catch (error) {
      logger.error('Failed to sync commands:', error);
      throw error;
    }
  }

  /**
   * Register feature events
   */
  private registerFeatureEvents(feature: IFeature): void {
    const events = (feature as { events?: Map<string, unknown> }).events || new Map();

    logger.info(`[DEBUG] Found ${events.size} events for feature ${feature.metadata.name}`);

    for (const [methodName, metadata] of events) {
      logger.info(
        `Registering event ${metadata.event} from feature ${feature.metadata.name} (method: ${methodName}, once: ${metadata.once})`,
      );

      const handler = async (...args: unknown[]) => {
        try {
          await (feature as { [key: string]: (...args: unknown[]) => Promise<void> })[methodName](...args);
        } catch (error) {
          logger.error(`Error handling event ${metadata.event}:`, error);
        }
      };

      if (metadata.once) {
        this.client.once(metadata.event, handler);
      } else {
        this.client.on(metadata.event, handler);
      }
    }
  }

  /**
   * Register feature schedulers
   */
  private registerFeatureSchedulers(feature: IFeature): void {
    const schedulers = (feature as { schedulers?: Map<string, unknown> }).schedulers || new Map();

    logger.info(`[DEBUG] Found ${schedulers.size} schedulers for feature ${feature.metadata.name}`);

    for (const [methodName, metadata] of schedulers) {
      logger.info(
        `Registering scheduler ${metadata.name} from feature ${feature.metadata.name} (method: ${methodName})`,
      );

      const handler = async () => {
        try {
          await (feature as { [key: string]: () => Promise<void> })[methodName]();
        } catch (error) {
          logger.error(`Error in scheduler ${metadata.name}:`, error);
        }
      };

      const fullSchedulerName = `${feature.metadata.name}.${metadata.name}`;
      this.schedulerManager.schedule(fullSchedulerName, metadata, handler);
    }
  }

  /**
   * Get scheduler manager (for external access)
   */
  getSchedulerManager(): SchedulerManager {
    return this.schedulerManager;
  }

  /**
   * Shutdown all feature resources
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down feature manager...');

    // Stop all schedulers
    this.schedulerManager.stopAll();

    // Disable all features
    for (const [featureName] of this.features) {
      try {
        await this.disableFeature(featureName);
      } catch (error) {
        logger.error(`Error disabling feature ${featureName}:`, error);
      }
    }

    logger.info('Feature manager shutdown complete');
  }
}
