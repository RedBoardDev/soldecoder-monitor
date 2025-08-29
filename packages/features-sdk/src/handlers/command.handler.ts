import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Client,
  ContextMenuCommandInteraction,
} from 'discord.js';
import { ApplicationCommandType, ContextMenuCommandBuilder, SlashCommandBuilder } from 'discord.js';
import { GuardExecutor } from '../guards/guard.executor';
import type { CommandRegistration, GuardContext, Logger } from '../types';
import { ErrorHandler } from '../utils/error-handler';

interface AutocompleteRegistration {
  feature: string;
  method: string;
  commandName: string;
  optionName?: string;
  handler: (interaction: AutocompleteInteraction) => Promise<void>;
}

/**
 * Command handler
 * Manages command registration and execution
 */
export class CommandHandler {
  private readonly commands = new Map<string, CommandRegistration>();
  private readonly autocompleteHandlers = new Map<string, AutocompleteRegistration>();
  private readonly guardExecutor: GuardExecutor;
  private readonly errorHandler: ErrorHandler;

  constructor(
    private readonly client: Client,
    private readonly logger: Logger,
  ) {
    this.guardExecutor = new GuardExecutor(logger);
    this.errorHandler = new ErrorHandler(logger);
  }

  /**
   * Register a command
   */
  registerCommand(registration: CommandRegistration): void {
    this.commands.set(registration.metadata.name, registration);
  }

  /**
   * Unregister a command
   */
  unregisterCommand(name: string): void {
    this.commands.delete(name);
  }

  /**
   * Register autocomplete handler
   */
  registerAutocomplete(registration: AutocompleteRegistration): void {
    const key = this.getAutocompleteKey(registration.commandName, registration.optionName);
    this.autocompleteHandlers.set(key, registration);
  }

  /**
   * Handle command interaction
   */
  async handleCommand(interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction): Promise<void> {
    const commandName = interaction.commandName;
    const registration = this.commands.get(commandName);

    if (!registration) {
      this.logger.warn(`No handler for command: ${commandName}`);
      return;
    }

    try {
      // Create guard context
      const guardContext: GuardContext = {
        interaction,
        client: this.client,
        featureName: registration.feature,
        methodName: registration.method,
      };

      // Execute guards
      const canExecute = await this.guardExecutor.execute(registration.guards, guardContext);

      if (!canExecute) {
        return; // Guard failed and handled the response
      }

      // Execute handler
      await registration.handler(interaction);
    } catch (error) {
      await this.errorHandler.handle(error, interaction);
    }
  }

  /**
   * Handle autocomplete interaction
   */
  async handleAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
    const commandName = interaction.commandName;
    const focusedOption = interaction.options.getFocused(true);

    // Try specific option key first, then default
    const specificKey = this.getAutocompleteKey(commandName, focusedOption.name);
    const defaultKey = this.getAutocompleteKey(commandName);

    const registration = this.autocompleteHandlers.get(specificKey) || this.autocompleteHandlers.get(defaultKey);

    if (!registration) {
      return; // No autocomplete handler
    }

    try {
      await registration.handler(interaction);
    } catch (error) {
      this.logger.error(`Error handling autocomplete for ${commandName}:`, error);
      await interaction.respond([]);
    }
  }

  /**
   * Get commands for Discord sync
   */
  getCommandsForSync(): unknown[] {
    const commands: unknown[] = [];

    for (const registration of this.commands.values()) {
      const metadata = registration.metadata;

      if ('description' in metadata) {
        // Slash command
        const builder = new SlashCommandBuilder().setName(metadata.name).setDescription(metadata.description);

        // Apply custom builder if provided
        if (metadata.builder) {
          metadata.builder(builder);
        }

        commands.push(builder.toJSON());
      } else {
        // Context menu command
        const type =
          'docs' in metadata && metadata.docs?.adminOnly ? ApplicationCommandType.User : ApplicationCommandType.Message;

        const builder = new ContextMenuCommandBuilder().setName(metadata.name).setType(type);

        commands.push(builder.toJSON());
      }
    }

    return commands;
  }

  /**
   * Get all registered commands
   */
  getCommands(): ReadonlyMap<string, CommandRegistration> {
    return this.commands;
  }

  /**
   * Generate autocomplete key
   */
  private getAutocompleteKey(commandName: string, optionName?: string): string {
    return `${commandName}:${optionName || 'default'}`;
  }
}
