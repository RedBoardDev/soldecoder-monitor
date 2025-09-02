import type {
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  Guild,
  ModalSubmitInteraction,
  PermissionResolvable,
  RoleSelectMenuInteraction,
  StringSelectMenuInteraction,
  UserSelectMenuInteraction,
} from 'discord.js';
import { PermissionFlagsBits } from 'discord.js';
import type { Logger } from '../types';
import { CustomIdBuilder } from '../utils/custom-id.builder';
import { ErrorHandler } from '../utils/error-handler';

export type AnyInteraction =
  | ButtonInteraction
  | ChannelSelectMenuInteraction
  | StringSelectMenuInteraction
  | ModalSubmitInteraction
  | UserSelectMenuInteraction
  | RoleSelectMenuInteraction;

/**
 * Base class for interaction handlers in Discord bot features
 * Provides common patterns for validation, parsing, error handling
 */
export abstract class BaseInteractionHandler {
  protected readonly errorHandler: ErrorHandler;

  constructor(protected readonly logger: Logger) {
    this.errorHandler = new ErrorHandler(logger);
  }

  // ============= VALIDATION HELPERS =============

  /**
   * Validate and return guild context from interaction
   */
  protected validateGuildContext(interaction: AnyInteraction): Guild {
    if (!interaction.guild) {
      throw new Error('Guild context is required');
    }
    return interaction.guild;
  }

  /**
   * Validate required permissions for interaction
   */
  protected validateRequiredPermissions(
    interaction: AnyInteraction,
    permissions: PermissionResolvable = PermissionFlagsBits.Administrator,
  ): void {
    if (!interaction.memberPermissions?.has(permissions)) {
      throw new Error('❌ You need Administrator permissions to use this.');
    }
  }

  // ============= CUSTOM ID PARSING =============

  /**
   * Parse custom ID into parts using existing CustomIdBuilder
   */
  protected parseCustomId(customId: string): string[] {
    return CustomIdBuilder.parse(customId);
  }

  /**
   * Extract entity ID from custom ID at specific index
   */
  protected extractEntityId(customId: string, index: number, entityName = 'entity'): string {
    const parts = this.parseCustomId(customId);

    if (parts.length <= index) {
      throw new Error(`Invalid custom ID format for ${entityName}: ${customId}`);
    }

    const entityId = parts[index];
    if (!entityId?.trim()) {
      throw new Error(`Missing ${entityName} ID in custom ID: ${customId}`);
    }

    return entityId;
  }

  /**
   * Parse structured custom ID with validation
   */
  protected parseStructuredCustomId<T>(customId: string, parser: (parts: string[]) => T, validationError: string): T {
    try {
      const parts = this.parseCustomId(customId);
      return parser(parts);
    } catch (_error) {
      throw new Error(`${validationError}: ${customId}`);
    }
  }

  // ============= INTERACTION MANAGEMENT =============

  /**
   * Safely defer interaction update
   */
  protected async safeDefer(interaction: AnyInteraction): Promise<void> {
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferUpdate();
    }
  }

  /**
   * Send ephemeral follow-up message
   */
  protected async safeFollowUp(interaction: AnyInteraction, content: string, ephemeral = true): Promise<void> {
    try {
      await interaction.followUp({ content, ephemeral });
    } catch (error) {
      this.logger.error('Failed to send follow-up message', error);
    }
  }

  /**
   * Update interaction reply with embeds/components
   */
  protected async safeUpdateReply(
    interaction: AnyInteraction,
    options: { embeds?: any[]; components?: any[]; content?: string },
  ): Promise<void> {
    try {
      await interaction.editReply(options);
    } catch (error) {
      this.logger.error('Failed to update interaction reply', error);
      throw error;
    }
  }

  // ============= ERROR HANDLING =============

  /**
   * Handle interaction error with standardized logging and response
   */
  protected async handleInteractionError(
    interaction: AnyInteraction,
    error: unknown,
    _context?: string,
  ): Promise<void> {
    const message = error instanceof Error ? error.message : '❌ An unexpected error occurred.';
    await this.safeFollowUp(interaction, message);
  }

  /**
   * Handle error and execute reset callback
   */
  protected async handleErrorWithReset(
    interaction: AnyInteraction,
    error: unknown,
    resetCallback: () => Promise<void>,
    context?: string,
  ): Promise<void> {
    await this.handleInteractionError(interaction, error, context);

    try {
      await resetCallback();
    } catch (resetError) {
      this.logger.error('Failed to reset after error', resetError);
    }
  }

  // ============= DISCORD HELPERS =============

  /**
   * Get all text channels from guild
   */
  protected getGuildTextChannels(guild: Guild): Array<{ id: string; name: string }> {
    return Array.from(guild.channels.cache.values())
      .filter((ch) => ch.type === 0) // GuildText
      .map((ch) => ({ id: ch.id, name: ch.name }));
  }

  /**
   * Build Discord mention from tag configuration
   */
  protected buildMentionFromTag(tagType: string | null, tagId: string | null): string | undefined {
    if (!tagType || !tagId) return undefined;
    return tagType === 'role' ? `<@&${tagId}>` : `<@${tagId}>`;
  }

  /**
   * Extract channel ID specifically (most common use case)
   */
  protected extractChannelId(customId: string, index: number): string {
    return this.extractEntityId(customId, index, 'channel');
  }
}
