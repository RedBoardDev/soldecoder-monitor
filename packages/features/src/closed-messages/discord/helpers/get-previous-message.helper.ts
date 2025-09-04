import { createFeatureLogger } from '@soldecoder-monitor/logger';
import { ChannelType, type Message, type TextChannel } from 'discord.js';

const logger = createFeatureLogger('get-previous-message-helper');

/**
 * Retrieves the previous message in a text channel
 * Used to detect if current closed position was triggered by take profit / stop loss
 */
export async function getPreviousMessage(message: Message): Promise<Message | null> {
  if (message.channel.type !== ChannelType.GuildText) {
    return null;
  }

  try {
    const messages = await (message.channel as TextChannel).messages.fetch({
      before: message.id,
      limit: 1,
    });

    return messages.first() ?? null;
  } catch (error) {
    logger.warn('Failed to fetch previous message', {
      error: error instanceof Error ? error.message : String(error),
      messageId: message.id,
      channelId: message.channelId,
    });
    return null;
  }
}
