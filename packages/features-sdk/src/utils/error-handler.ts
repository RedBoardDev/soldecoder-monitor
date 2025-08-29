import type { BaseInteraction } from 'discord.js';
import { Colors, EmbedBuilder } from 'discord.js';
import type { Logger } from '../types';

interface InteractionReplyOptions {
  content?: string;
  embeds?: unknown[];
  ephemeral?: boolean;
}

type RepliableInteraction = BaseInteraction & {
  reply?: (options: InteractionReplyOptions) => Promise<unknown>;
  editReply?: (options: InteractionReplyOptions) => Promise<unknown>;
  followUp?: (options: InteractionReplyOptions) => Promise<unknown>;
  replied?: boolean;
  deferred?: boolean;
};

/**
 * Error handler utility
 * Provides consistent error handling and user feedback
 */
export class ErrorHandler {
  constructor(private readonly logger: Logger) {}

  /**
   * Handle an error in an interaction context
   */
  async handle(error: unknown, interaction?: BaseInteraction): Promise<void> {
    this.logger.error('Error occurred:', error);

    // If we have an interaction, try to respond
    if (interaction && this.canRespond(interaction)) {
      const repliable = interaction as RepliableInteraction;
      const message = this.getErrorMessage(error);

      try {
        const response = {
          content: `❌ ${message}`,
          ephemeral: true,
        };

        if (repliable.replied) {
          await repliable.followUp?.(response);
        } else if (repliable.deferred) {
          await repliable.editReply?.(response);
        } else if (repliable.reply) {
          await repliable.reply(response);
        }
      } catch (replyError) {
        this.logger.error('Failed to send error response:', replyError);
      }
    }
  }

  /**
   * Create an error embed
   */
  createErrorEmbed(title: string, description: string, fields?: Array<{ name: string; value: string }>): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setTitle(`❌ ${title}`)
      .setDescription(description)
      .setColor(Colors.Red)
      .setTimestamp();

    if (fields) {
      embed.addFields(fields);
    }

    return embed;
  }

  /**
   * Format validation errors
   */
  formatValidationErrors(errors: Record<string, string[]>): string {
    const messages: string[] = [];

    for (const [field, fieldErrors] of Object.entries(errors)) {
      messages.push(`**${field}:**\n${fieldErrors.map((e) => `• ${e}`).join('\n')}`);
    }

    return messages.join('\n\n');
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      // Known error types
      if (error.name === 'DiscordAPIError') {
        return 'A Discord API error occurred. Please try again later.';
      } else if (error.name === 'RateLimitError') {
        return 'You are being rate limited. Please try again later.';
      } else if (error.message.includes('Missing Permissions')) {
        return "I don't have the required permissions to perform this action.";
      } else if (error.message.includes('Unknown Message')) {
        return 'This message no longer exists.';
      } else if (error.message.includes('Unknown Channel')) {
        return "This channel no longer exists or I don't have access to it.";
      }

      // In development, show actual error message
      if (process.env.NODE_ENV === 'development') {
        return error.message;
      }
    }

    // Generic error message
    return 'An unexpected error occurred. Please try again later.';
  }

  /**
   * Check if we can respond to an interaction
   */
  private canRespond(interaction: BaseInteraction): boolean {
    return (
      interaction.isCommand() ||
      interaction.isButton() ||
      interaction.isStringSelectMenu() ||
      interaction.isModalSubmit() ||
      interaction.isContextMenuCommand()
    );
  }
}
