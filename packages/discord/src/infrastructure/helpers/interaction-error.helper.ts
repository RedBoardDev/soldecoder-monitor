import { DiscordError } from '@discord/domain/errors/base.error';
import { logger } from '@soldecoder-monitor/logger';
import type {
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  ModalSubmitInteraction,
  RoleSelectMenuInteraction,
  StringSelectMenuInteraction,
  UserSelectMenuInteraction,
} from 'discord.js';
import { MessageFlags } from 'discord.js';

type InteractionType =
  | ButtonInteraction
  | StringSelectMenuInteraction
  | ChannelSelectMenuInteraction
  | ModalSubmitInteraction
  | UserSelectMenuInteraction
  | RoleSelectMenuInteraction;

/**
 * Sends an ephemeral error message for any interaction error
 * Handles both application errors with user-friendly messages and unexpected errors
 */
export async function sendInteractionError(
  interaction: InteractionType,
  error: unknown,
  context: Record<string, unknown> = {},
  fallbackMessage = '❌ **Unexpected Error**: Something went wrong. Please try again later.',
): Promise<void> {
  try {
    let message: string;
    let logLevel: 'warn' | 'error' = 'error';
    let logMessage: string;
    let logContext = { ...context };

    // Handle application errors with user-friendly messages
    if (error instanceof DiscordError) {
      message = error.getFormattedUserMessage();
      logLevel = 'warn';
      logMessage = 'Interaction failed with application error';
      logContext = { ...logContext, ...error.getLogContext() };
    } else {
      // Handle unexpected errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      message = fallbackMessage;
      logMessage = 'Unexpected error in interaction';
      logContext = {
        ...logContext,
        errorMessage,
        errorType: error?.constructor?.name || 'unknown',
      };
    }

    // Always send as ephemeral follow-up (never replace embeds)
    await interaction.followUp({
      content: message,
      flags: MessageFlags.Ephemeral,
    });

    // Log with appropriate level and context
    if (logLevel === 'warn') {
      logger.warn(logMessage, logContext);
    } else {
      const errorToLog = error instanceof Error ? error : new Error(String(error));
      logger.error(logMessage, errorToLog, logContext);
    }
  } catch (sendError) {
    // Fallback if ephemeral message fails
    logger.error('Failed to send ephemeral error message', sendError as Error, {
      originalError: error instanceof Error ? error.message : String(error),
      interactionId: interaction.id,
      ...context,
    });
  }
}

/**
 * Sends a simple ephemeral error message with custom text
 */
export async function sendSimpleInteractionError(
  interaction: InteractionType,
  message: string,
  context: Record<string, unknown> = {},
): Promise<void> {
  try {
    await interaction.followUp({
      content: message,
      flags: MessageFlags.Ephemeral,
    });

    logger.debug('Simple error message sent', { message, ...context });
  } catch (sendError) {
    logger.error('Failed to send simple error message', sendError as Error, {
      message,
      interactionId: interaction.id,
      ...context,
    });
  }
}

/**
 * Validates that an interaction is in a proper state for error handling
 * Returns true if we can send follow-up messages
 */
export function canSendFollowUp(interaction: InteractionType): boolean {
  return interaction.deferred || interaction.replied;
}

/**
 * Handles errors for non-deferred interactions (sends ephemeral reply)
 * Use this for early validation errors before deferring
 */
export async function sendEarlyInteractionError(
  interaction: InteractionType,
  message: string,
  context: Record<string, unknown> = {},
): Promise<void> {
  try {
    if (interaction.replied || interaction.deferred) {
      // If already replied/deferred, use follow-up
      await sendSimpleInteractionError(interaction, message, context);
    } else {
      // Send ephemeral reply
      await interaction.reply({
        content: message,
        flags: MessageFlags.Ephemeral,
      });
    }

    logger.debug('Early error message sent', { message, ...context });
  } catch (sendError) {
    logger.error('Failed to send early error message', sendError as Error, {
      message,
      interactionId: interaction.id,
      ...context,
    });
  }
}
