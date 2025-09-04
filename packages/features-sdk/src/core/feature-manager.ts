import type { Client } from 'discord.js';
import { REST, Routes } from 'discord.js';
import { HelpGenerator } from '../documentation/help.generator';
import { CommandHandler } from '../handlers/command.handler';
import { EventDispatcher } from '../handlers/event.dispatcher';
import { InteractionRouter } from '../handlers/interaction.router';
import { SchedulerService } from '../handlers/scheduler.service';
import type { CommandRegistration, FeatureContext, Logger } from '../types';
import { MetadataScanner } from '../utils/metadata.scanner';
import type { Feature } from './feature-base';
import { createFeatureContext } from './feature-context';

type InteractionType = 'button' | 'select' | 'modal';

export interface HelpCommandConfig {
  enabled: boolean;
  commandName: string;
}

export interface FeatureManagerOptions {
  client: Client;
  logger: Logger;
  globalConfig?: Record<string, unknown>;
  helpCommand?: HelpCommandConfig;
}

/**
 * Feature Manager
 * Manages the lifecycle of features and their components
 */
export class FeatureManager {
  private readonly features = new Map<string, Feature>();
  private readonly contexts = new Map<string, FeatureContext>();
  private readonly scanner = new MetadataScanner();
  private readonly commandHandler: CommandHandler;
  private readonly interactionRouter: InteractionRouter;
  private readonly eventDispatcher: EventDispatcher;
  private readonly schedulerService: SchedulerService;
  private readonly helpGenerator = new HelpGenerator();
  private readonly featurePrefixes = new Map<string, string[]>(); // Map of feature name to interaction prefixes
  private isInitialized = false;

  constructor(private readonly options: FeatureManagerOptions) {
    this.commandHandler = new CommandHandler(options.client, options.logger);
    this.interactionRouter = new InteractionRouter(options.client, options.logger);
    this.eventDispatcher = new EventDispatcher(options.client, options.logger);
    this.schedulerService = new SchedulerService(options.logger);
  }

  /**
   * Register a feature
   */
  async registerFeature(FeatureClass: new () => Feature, config?: Record<string, unknown>): Promise<void> {
    const feature = new FeatureClass();
    const metadata = feature.metadata;

    if (!metadata?.name) {
      throw new Error(`Feature ${FeatureClass.name} must have metadata with a name`);
    }

    if (this.features.has(metadata.name)) {
      throw new Error(`Feature ${metadata.name} is already registered`);
    }

    // Create context for this feature
    const context = createFeatureContext(this.options.client, this.createFeatureLogger(metadata.name), {
      ...this.options.globalConfig,
      ...config,
    });

    feature.setContext(context);
    this.features.set(metadata.name, feature);
    this.contexts.set(metadata.name, context);

    // Store interaction prefix if provided
    if (metadata.interactionPrefix) {
      this.featurePrefixes.set(metadata.name, [metadata.interactionPrefix]);
      this.options.logger.debug(
        `Feature ${metadata.name} registered with interaction prefix: ${metadata.interactionPrefix}`,
      );
    }

    // Scan for decorators
    this.scanner.scanFeature(feature, metadata.name);

    // Call onLoad
    if (feature.onLoad) {
      await feature.onLoad(context);
    }

    // Enable if not explicitly disabled
    if (metadata.enabled !== false) {
      await this.enableFeature(metadata.name);
    }

    this.options.logger.info(`Registered feature: ${metadata.name} v${metadata.version}`);
  }

  /**
   * Enable a feature
   */
  async enableFeature(name: string): Promise<void> {
    const feature = this.features.get(name);
    const context = this.contexts.get(name);

    if (!feature || !context) {
      throw new Error(`Feature ${name} not found`);
    }

    // Call onEnable
    if (feature.onEnable) {
      await feature.onEnable(context);
    }

    // Register all handlers from metadata
    const metadata = this.scanner.getFeatureMetadata(name);

    if (metadata) {
      // Register commands
      metadata.commands.forEach((cmd) => {
        this.commandHandler.registerCommand(cmd);
        this.helpGenerator.addCommand(cmd);
      });

      // Register interactions with automatic prefixing
      metadata.interactions.forEach((int) => {
        const featurePrefix = this.featurePrefixes.get(name)?.[0];

        if (featurePrefix) {
          // Feature has a prefix - automatically prepend it to the pattern
          const prefixedPattern = this.addPrefixToPattern(int.pattern, featurePrefix);

          // Create a new registration with the prefixed pattern
          const prefixedRegistration = {
            ...int,
            pattern: prefixedPattern,
          };

          this.interactionRouter.registerHandler(prefixedRegistration, int.type);
        } else {
          // No prefix - register normally
          this.interactionRouter.registerHandler(int, int.type);
        }
      });

      // Register events
      metadata.events.forEach((evt) => {
        this.eventDispatcher.registerEvent(evt);
      });

      // Register schedulers
      metadata.schedulers.forEach((sch) => {
        this.schedulerService.registerScheduler(sch);
      });
    }

    this.options.logger.info(`Enabled feature: ${name}`);
  }

  /**
   * Disable a feature
   */
  async disableFeature(name: string): Promise<void> {
    const feature = this.features.get(name);

    if (!feature) {
      throw new Error(`Feature ${name} not found`);
    }

    // Call onDisable
    if (feature.onDisable) {
      await feature.onDisable();
    }

    // Unregister handlers
    const metadata = this.scanner.getFeatureMetadata(name);

    if (metadata) {
      metadata.commands.forEach((cmd) => {
        this.commandHandler.unregisterCommand(cmd.metadata.name);
        this.helpGenerator.removeCommand(cmd.metadata.name);
      });

      metadata.interactions.forEach((int) => {
        this.interactionRouter.unregisterHandler(int.pattern);
      });

      metadata.events.forEach((evt) => {
        this.eventDispatcher.unregisterEvent(evt.feature, evt.event);
      });

      metadata.schedulers.forEach((sch) => {
        this.schedulerService.unregisterScheduler(`${sch.feature}.${sch.method}`);
      });
    }

    this.options.logger.info(`Disabled feature: ${name}`);
  }

  /**
   * Initialize the manager (setup Discord event listeners)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Setup interaction listener
    this.options.client.on('interactionCreate', async (interaction) => {
      try {
        // Handle commands
        if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
          await this.commandHandler.handleCommand(interaction);
        }
        // Handle components (buttons, selects)
        else if (interaction.isButton() || interaction.isAnySelectMenu()) {
          await this.interactionRouter.handleInteraction(interaction);
        }
        // Handle modals
        else if (interaction.isModalSubmit()) {
          await this.interactionRouter.handleModal(interaction);
        }
        // Handle autocomplete
        else if (interaction.isAutocomplete()) {
          await this.commandHandler.handleAutocomplete(interaction);
        }
      } catch (error) {
        this.options.logger.error('Error handling interaction:', error);
      }
    });

    // Register help command if enabled
    const helpConfig = this.options.helpCommand || { enabled: true, commandName: 'help' };
    if (helpConfig.enabled) {
      await this.registerHelpCommand();
    }

    this.isInitialized = true;
    this.options.logger.info('Feature manager initialized');
  }

  /**
   * Sync commands with Discord
   */
  async syncCommands(): Promise<void> {
    const commands = this.commandHandler.getCommandsForSync();

    if (!this.options.client.application) {
      throw new Error('Client application not ready');
    }

    const rest = new REST().setToken(this.options.client.token ?? '');

    try {
      await rest.put(Routes.applicationCommands(this.options.client.application.id), { body: commands });
      this.options.logger.info(`Synced ${commands.length} commands with Discord`);
    } catch (error) {
      this.options.logger.error('Failed to sync commands:', error);
      throw error;
    }
  }

  /**
   * Shutdown the manager
   */
  async shutdown(): Promise<void> {
    this.options.logger.info('Shutting down feature manager...');

    // Stop schedulers
    this.schedulerService.stopAll();

    // Disable all features
    for (const [name, feature] of this.features) {
      try {
        await this.disableFeature(name);

        if (feature.onUnload) {
          await feature.onUnload();
        }
      } catch (error) {
        this.options.logger.error(`Error shutting down feature ${name}:`, error);
      }
    }

    this.features.clear();
    this.contexts.clear();

    this.options.logger.info('Feature manager shutdown complete');
  }

  /**
   * Get all registered features
   */
  getFeatures(): ReadonlyMap<string, Feature> {
    return this.features;
  }

  /**
   * Get feature by name
   */
  getFeature(name: string): Feature | undefined {
    return this.features.get(name);
  }

  /**
   * Get help generator for external access
   */
  getHelpGenerator(): HelpGenerator {
    return this.helpGenerator;
  }

  /**
   * Register the built-in help command
   */
  private async registerHelpCommand(): Promise<void> {
    const helpConfig = this.options.helpCommand || { enabled: true, commandName: 'help' };
    const commandName = helpConfig.commandName;

    const helpCommand: CommandRegistration = {
      feature: 'core',
      method: 'help',
      metadata: {
        name: commandName,
        description: 'Show available commands and their usage',
        docs: {
          category: 'Core',
          description: 'Display all available commands organized by category',
          usage: `/${commandName} [command]`,
        },
        builder: (builder) => {
          builder.addStringOption((option) =>
            option
              .setName('command')
              .setDescription('Get detailed help for a specific command')
              .setRequired(false)
              .setAutocomplete(true),
          );
          return builder;
        },
      },
      guards: [],
      handler: async (interaction: unknown) => {
        const interactionWithOptions = interaction as { options?: { getString: (name: string) => string | null } };
        const commandName = interactionWithOptions.options?.getString('command') || null;
        const embed = commandName
          ? this.helpGenerator.generateCommandHelp(commandName)
          : this.helpGenerator.generateFullHelp();

        const repliable = interaction as { reply?: (options: unknown) => Promise<unknown> };
        if (repliable.reply) {
          await repliable.reply({ embeds: [embed], ephemeral: true });
        }
      },
    };

    this.commandHandler.registerCommand(helpCommand);

    // Register autocomplete for help command
    this.commandHandler.registerAutocomplete({
      feature: 'core',
      method: 'helpAutocomplete',
      commandName: commandName,
      optionName: 'command',
      handler: async (interaction) => {
        if ('options' in interaction && 'respond' in interaction) {
          const focused = interaction.options.getFocused().toLowerCase();
          const commands = this.helpGenerator
            .getAllCommands()
            .filter((cmd) => cmd.name.toLowerCase().includes(focused))
            .slice(0, 25)
            .map((cmd) => ({ name: cmd.name, value: cmd.name }));

          await interaction.respond(commands);
        }
      },
    });
  }

  /**
   * Add a prefix to a pattern (string or RegExp)
   */
  private addPrefixToPattern(pattern: string | RegExp, prefix: string): string | RegExp {
    if (typeof pattern === 'string') {
      // For string patterns, simply prepend the prefix
      return prefix + pattern;
    } else if (pattern instanceof RegExp) {
      // For regex patterns, we need to be careful
      const source = pattern.source;
      const flags = pattern.flags;

      // Remove ^ from the beginning if present (we'll add it back with the prefix)
      let cleanSource = source;
      if (source.startsWith('^')) {
        cleanSource = source.slice(1);
      }

      // Escape the prefix for regex safety
      const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Create new regex with prefix
      // Always add ^ to ensure it matches from the start
      return new RegExp(`^${escapedPrefix}${cleanSource}`, flags);
    }

    return pattern;
  }

  /**
   * Create a logger for a specific feature
   */
  private createFeatureLogger(featureName: string): Logger {
    const { logger } = this.options;
    return {
      debug: (msg, ...args) => logger.debug(`[${featureName}] ${msg}`, ...args),
      info: (msg, ...args) => logger.info(`[${featureName}] ${msg}`, ...args),
      warn: (msg, ...args) => logger.warn(`[${featureName}] ${msg}`, ...args),
      error: (msg, error) => logger.error(`[${featureName}] ${msg}`, error),
    };
  }
}
