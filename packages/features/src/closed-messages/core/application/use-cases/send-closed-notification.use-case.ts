import type { ChannelConfigEntity, GuildSettingsRepository } from '@soldecoder-monitor/data';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { Message, TextChannel } from 'discord.js';
import { prepareMention } from '../../../discord/helpers/mention.helper';
import { safePin } from '../../../discord/helpers/safe-pin.helper';
import type { TriggerData } from '../../domain/types/trigger.types';
import type { ClosedPosition } from '../../domain/value-objects/closed-position.vo';
import { prepareClosedPositionContent } from '../helpers/content-preparation.helper';
import { forwardToGlobalChannelIfEnabled } from '../helpers/global-forward.helper';

const logger = createFeatureLogger('send-closed-notification-use-case');

export class SendClosedNotificationUseCase {
  constructor(private readonly guildSettingsRepository: GuildSettingsRepository) {}

  async execute(
    originalMessage: Message,
    closedPosition: ClosedPosition,
    shouldSendToGlobal: boolean,
    channelConfig: ChannelConfigEntity,
    meetsThreshold: boolean,
    triggerData: TriggerData | null = null,
  ): Promise<void> {
    try {
      const mentionData = prepareMention(channelConfig, meetsThreshold);

      const preparedContent = await prepareClosedPositionContent(
        originalMessage,
        closedPosition,
        mentionData.mention,
        channelConfig,
        triggerData,
      );

      const cleanMessage = await this.deleteAndResendOriginalMessage(originalMessage);

      const sentMessage = await this.sendToChannel(
        cleanMessage,
        preparedContent.content,
        preparedContent.files,
        mentionData.allowedMentions,
      );

      if (!channelConfig.pin || !meetsThreshold) return;

      try {
        await safePin(sentMessage);
      } catch (pinError) {
        logger.error('Failed to pin message', {
          error: pinError instanceof Error ? pinError.message : pinError,
          messageId: sentMessage.id,
        });
      }

      if (!shouldSendToGlobal) return;

      await forwardToGlobalChannelIfEnabled(
        this.guildSettingsRepository,
        sentMessage,
        channelConfig.guildId,
        meetsThreshold,
      );
    } catch (error) {
      logger.error('Failed to send closed position notification', error as Error, {
        messageId: originalMessage.id,
        channelId: originalMessage.channelId,
        positionAddress: closedPosition.pairName,
      });
      throw error;
    }
  }

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
