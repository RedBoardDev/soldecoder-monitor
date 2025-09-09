import type { GuildSettingsEntity } from '@soldecoder-monitor/data';
import type { FeatureContext } from '@soldecoder-monitor/features-sdk';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import { buildSummaryMessage } from '../../../discord/ui/summary-message-builder';
import type { SummaryData } from '../../domain/types/summary-data.types';
import type { SummaryContextVO } from '../../domain/value-objects/summary-context.vo';

const logger = createFeatureLogger('send-summary-notification-use-case');

export class SendSummaryNotificationUseCase {
  constructor(private readonly context: FeatureContext) {}

  async execute(
    summaryContext: SummaryContextVO,
    guildConfig: GuildSettingsEntity,
    summaryData: SummaryData,
  ): Promise<void> {
    try {
      const { embed, attachment } = await buildSummaryMessage(summaryData, summaryContext.type);

      const channel = await this.context.client.channels.fetch(guildConfig.globalChannelId || '');

      if (!channel || !channel.isTextBased() || !('send' in channel)) {
        throw new Error(`Invalid channel: ${guildConfig.globalChannelId}`);
      }

      await channel.send({
        embeds: [embed],
        files: [attachment],
      });
    } catch (error) {
      logger.error(
        `❌ Failed to send ${summaryContext.typeLabel} summary for guild: ${guildConfig.guildId}`,
        error as Error,
        {
          channelId: guildConfig.globalChannelId,
        },
      );
      throw error;
    }
  }
}
