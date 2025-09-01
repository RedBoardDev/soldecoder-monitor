import { time } from '@shared/domain';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { Client, EmbedBuilder, Message, TextChannel } from 'discord.js';
import { ChannelType, DiscordAPIError } from 'discord.js';

const logger = createFeatureLogger('discord-message-helper');

/**
 * Get a Discord text channel by ID
 */
export function getTextChannel(client: Client, channelId: string): TextChannel | null {
  const channel = client.channels.cache.get(channelId);
  if (!channel || channel.type !== ChannelType.GuildText) {
    return null;
  }
  return channel as TextChannel;
}

/**
 * Check if a message is too old (based on age in days)
 */
export function isMessageTooOld(message: Message, maxAgeDays: number): boolean {
  const messageAgeDays = (Date.now() - message.createdAt.getTime()) / time.days(1);
  return messageAgeDays > maxAgeDays;
}

/**
 * Check if a message is the latest in its channel
 */
export async function isLatestMessage(textChannel: TextChannel, messageId: string): Promise<boolean> {
  try {
    const latestMessages = await textChannel.messages.fetch({ limit: 1 });
    return latestMessages.first()?.id === messageId;
  } catch {
    return false;
  }
}

/**
 * Safely delete a message (ignore errors)
 */
export async function deleteMessageSafely(message: Message): Promise<void> {
  try {
    await message.delete();
  } catch (error) {
    logger.debug('Failed to delete message (ignored)', {
      messageId: message.id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Try to update an existing message with new embed
 * Returns true if successful, false if message should be recreated
 */
export async function tryUpdateMessage(
  textChannel: TextChannel,
  messageId: string,
  embed: EmbedBuilder,
  maxAgeDays: number,
): Promise<boolean> {
  try {
    const existingMessage = await textChannel.messages.fetch(messageId);
    if (!existingMessage) {
      return false;
    }

    // Check message age
    if (isMessageTooOld(existingMessage, maxAgeDays)) {
      await deleteMessageSafely(existingMessage);
      return false;
    }

    // Check if message is still the latest
    if (!(await isLatestMessage(textChannel, messageId))) {
      await deleteMessageSafely(existingMessage);
      return false;
    }

    // Update the message
    await existingMessage.edit({ embeds: [embed] });
    return true;
  } catch (error) {
    if (error instanceof DiscordAPIError) {
      switch (error.code) {
        case 10008: // Unknown Message
        case 10003: // Unknown Channel
          return false;
        case 50013: // Missing Permissions
          logger.warn('Missing permissions to update message', { messageId });
          return false;
        default:
          logger.debug('Discord API error during message update', {
            messageId,
            code: error.code,
          });
          return false;
      }
    }
    throw error;
  }
}

/**
 * Create a new message in a channel
 */
export async function createMessage(textChannel: TextChannel, embed: EmbedBuilder): Promise<Message> {
  return await textChannel.send({ embeds: [embed] });
}
