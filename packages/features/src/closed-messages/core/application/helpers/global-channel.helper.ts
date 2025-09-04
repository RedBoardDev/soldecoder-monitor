import type { GuildSettingsRepository } from '@soldecoder-monitor/data';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { Message } from 'discord.js';

const logger = createFeatureLogger('global-channel-helper');

/**
 * Sends message to global channel if enabled in guild settings
 * Only sends for triggered events (take profit / stop loss)
 */
export async function sendToGlobalChannelIfEnabled(
  guildSettingsRepository: GuildSettingsRepository,
  originalMessage: Message,
  contentBody: string,
  guildId: string,
): Promise<void> {
  try {
    const guildSettings = await guildSettingsRepository.getByGuildId(guildId);

    if (!guildSettings) {
      logger.debug('Guild settings not found, skipping global channel', { guildId });
      return;
    }

    if (!guildSettings.forwardTpSl || !guildSettings.globalChannelId) {
      logger.debug('Global channel forwarding disabled or not configured', {
        guildId,
        forwardTpSl: guildSettings.forwardTpSl,
        hasGlobalChannelId: !!guildSettings.globalChannelId,
      });
      return;
    }

    const globalChannel = originalMessage.guild?.channels.cache.get(guildSettings.globalChannelId);

    if (!globalChannel || !globalChannel.isSendable()) {
      logger.warn('Global channel not found or not sendable', {
        guildId,
        globalChannelId: guildSettings.globalChannelId,
        found: !!globalChannel,
        sendable: globalChannel?.isSendable(),
      });
      return;
    }

    await globalChannel.send({
      content: contentBody,
    });

    logger.debug('Message sent to global channel successfully', {
      guildId,
      globalChannelId: guildSettings.globalChannelId,
    });
  } catch (error) {
    logger.error('Failed to send message to global channel', error as Error, {
      guildId,
      messageId: originalMessage.id,
    });
    throw error;
  }
}
