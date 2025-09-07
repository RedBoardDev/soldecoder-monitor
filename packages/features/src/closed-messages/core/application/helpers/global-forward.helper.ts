import type { GuildSettingsRepository } from '@soldecoder-monitor/data';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { Message } from 'discord.js';

const logger = createFeatureLogger('global-forward-helper');

/**
 * Forwards message to global channel if enabled in guild settings
 * Only forwards for triggered events (take profit / stop loss) and if threshold is met
 */
export async function forwardToGlobalChannelIfEnabled(
  guildSettingsRepository: GuildSettingsRepository,
  originalMessage: Message,
  guildId: string,
  meetsThreshold: boolean,
): Promise<void> {
  try {
    const guildSettings = await guildSettingsRepository.getByGuildId(guildId);

    if (!guildSettings) {
      logger.debug('No guild settings found, skipping forward', { guildId });
      return;
    }

    if (!guildSettings.forward || !guildSettings.globalChannelId) {
      logger.debug('Forward disabled or no global channel configured', {
        guildId,
        forward: guildSettings.forward,
        hasGlobalChannelId: !!guildSettings.globalChannelId,
      });
      return;
    }

    if (!meetsThreshold) return;

    const globalChannel = originalMessage.guild?.channels.cache.get(guildSettings.globalChannelId);

    if (!globalChannel || !globalChannel.isSendable()) {
      logger.warn('Global channel not accessible', {
        guildId,
        globalChannelId: guildSettings.globalChannelId,
        channelFound: !!globalChannel,
        isSendable: globalChannel?.isSendable(),
        channelType: globalChannel?.type,
      });
      return;
    }

    logger.debug('Attempting to forward message', {
      guildId,
      messageId: originalMessage.id,
      messageAge: Date.now() - originalMessage.createdTimestamp,
      messageAuthor: originalMessage.author.id,
      messageContent: originalMessage.content?.substring(0, 100),
      hasEmbeds: originalMessage.embeds.length > 0,
      hasAttachments: originalMessage.attachments.size > 0,
      globalChannelId: guildSettings.globalChannelId,
      globalChannelType: globalChannel.type,
    });

    await originalMessage.forward(globalChannel);

    logger.debug('Message forwarded successfully', {
      guildId,
      messageId: originalMessage.id,
      globalChannelId: guildSettings.globalChannelId,
    });
  } catch (error) {
    logger.error('Failed to forward message to global channel', error as Error, {
      guildId,
      messageId: originalMessage.id,
      errorMessage: (error as Error).message,
      errorStack: (error as Error).stack,
      messageAge: Date.now() - originalMessage.createdTimestamp,
      messageAuthor: originalMessage.author.id,
      messageBot: originalMessage.author.bot,
      hasEmbeds: originalMessage.embeds.length > 0,
      hasAttachments: originalMessage.attachments.size > 0,
    });
    throw error;
  }
}
