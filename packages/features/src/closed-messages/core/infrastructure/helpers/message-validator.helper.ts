import type { Message } from 'discord.js';
import { ChannelType } from 'discord-api-types/v10';
import { MessageFilter } from '../../domain/value-objects/message-filter.vo';

/**
 * Validate if a Discord message should be processed as a
 * closed position message.
 */
export const validateMessageForProcessing = (message: Message): boolean => {
  if (
    message.guildId === null ||
    message.channel.type !== ChannelType.GuildText ||
    message.content.trim().length === 0
  ) {
    return false;
  }

  // Only process messages from users or webhooks, not from bots to avoid loop
  if (message.author.bot && !message.webhookId) {
    return false;
  }

  const filter = MessageFilter.fromDiscordMessage(message.content, message.guildId, message.channel.type);

  return filter.matchesClosedMessage();
};
