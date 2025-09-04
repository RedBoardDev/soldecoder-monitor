import type { ChannelConfigEntity, GuildSettingsRepository } from '@soldecoder-monitor/data';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { Message, TextChannel } from 'discord.js';
import { prepareMention } from '../../../discord/helpers/mention.helper';
import { safePin } from '../../../discord/helpers/safe-pin.helper';
import type { ClosedPosition } from '../../domain/value-objects/closed-position.vo';
import { prepareClosedPositionContent } from '../helpers/content-preparation.helper';
import { sendToGlobalChannelIfEnabled } from '../helpers/global-channel.helper';

const logger = createFeatureLogger('send-closed-notification-use-case');

export class SendClosedNotificationUseCase {
  constructor(private readonly guildSettingsRepository: GuildSettingsRepository) {}

  async execute(
    originalMessage: Message,
    closedPosition: ClosedPosition,
    shouldSendToGlobal: boolean,
    channelConfig: ChannelConfigEntity,
  ): Promise<void> {
    try {
      const mentionData = prepareMention(channelConfig);

      const preparedContent = await prepareClosedPositionContent(
        originalMessage,
        closedPosition,
        mentionData.mention,
        channelConfig,
      );

      const cleanMessage = await this.deleteAndResendOriginalMessage(originalMessage);

      const sentMessage = await this.sendToChannel(
        cleanMessage,
        preparedContent.content,
        preparedContent.files,
        mentionData.allowedMentions,
      );

      if (channelConfig.pin) {
        try {
          await safePin(sentMessage);
        } catch (pinError) {
          logger.warn('Failed to pin message', {
            error: pinError instanceof Error ? pinError.message : pinError,
            messageId: sentMessage.id,
          });
        }
      }

      if (!shouldSendToGlobal || !preparedContent.triggerData) return;

      await sendToGlobalChannelIfEnabled(
        this.guildSettingsRepository,
        originalMessage,
        preparedContent.contentBody,
        channelConfig.guildId,
      );
    } catch (error) {
      logger.error('Failed to send closed position notification', error as Error, {
        messageId: originalMessage.id,
        channelId: originalMessage.channelId,
        positionAddress: closedPosition.positionAddress,
      });
      throw error;
    }
  }

  /**
   * Sends message to Discord channel with fallback logic
   */
  private async sendToChannel(
    originalMessage: Message,
    content: string,
    files: Array<{ attachment: Buffer; name: string }> | undefined,
    allowedMentions: { users?: string[]; roles?: string[] } | undefined,
  ): Promise<Message> {
    const channel = originalMessage.channel as TextChannel;

    try {
      return await originalMessage.reply({
        content,
        ...(files && { files }),
        allowedMentions,
      });
    } catch (error) {
      logger.debug('Reply failed, trying channel.send', {
        error: error instanceof Error ? error.message : error,
        messageId: originalMessage.id,
      });

      return await channel.send({
        content,
        ...(files && { files }),
        allowedMentions,
      });
    }
  }

  /**
   * Deletes the original message and resends it without attachments
   * This is the only way I found to remove attachments from another bot's message
   */
  private async deleteAndResendOriginalMessage(originalMessage: Message): Promise<Message> {
    const channel = originalMessage.channel as TextChannel;

    try {
      await originalMessage.delete();

      const cleanMessage = await channel.send({
        content: originalMessage.content || undefined,
        embeds: originalMessage.embeds,
        components: originalMessage.components,
      });
      return cleanMessage;
    } catch (error) {
      logger.error('Failed to delete and resend original message', error as Error, {
        messageId: originalMessage.id,
        channelId: channel.id,
      });
      return originalMessage;
    }
  }
}
