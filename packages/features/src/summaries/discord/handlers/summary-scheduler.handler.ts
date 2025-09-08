import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { ProcessSummaryUseCase } from '../../core/application/use-cases/process-summary.use-case';
import type { SendSummaryNotificationUseCase } from '../../core/application/use-cases/send-summary-notification.use-case';
import type { ProcessedGuild } from '../../core/domain/types/processed-guild.types';
import type { SummaryContextVO } from '../../core/domain/value-objects/summary-context.vo';

const logger = createFeatureLogger('summary-scheduler-handler');

export class SummarySchedulerHandler {
  constructor(
    private readonly processSummaryUseCase: ProcessSummaryUseCase,
    private readonly sendNotificationUseCase: SendSummaryNotificationUseCase,
  ) {}

  async execute(summaryContext: SummaryContextVO): Promise<void> {
    try {
      const result = await this.processSummaryUseCase.execute(summaryContext);

      if (!result.isSuccess || result.processedGuilds.length === 0) return;

      await this.sendNotifications(summaryContext, result.processedGuilds);
    } catch (error) {
      await this.handleError(summaryContext, error);
    }
  }

  private async sendNotifications(summaryContext: SummaryContextVO, processedGuilds: ProcessedGuild[]): Promise<void> {
    for (const guildResult of processedGuilds) {
      if (!guildResult.success) {
        logger.warn(`Skipping failed guild processing: ${guildResult.guildConfig.guildId}`, {
          error: guildResult.error,
        });
        continue;
      }

      try {
        await this.sendNotificationUseCase.execute(summaryContext, guildResult.guildConfig, guildResult.summaryData);
      } catch (error) {
        logger.warn(
          `Failed to send ${summaryContext.typeLabel} summary for guild: ${guildResult.guildConfig.guildId}`,
          {
            error: error instanceof Error ? error.message : String(error),
          },
        );
      }
    }
  }

  private async handleError(summaryContext: SummaryContextVO, error: unknown): Promise<void> {
    logger.error(`Failed to handle ${summaryContext.typeLabel} summary`, error as Error, {
      summaryType: summaryContext.type,
    });
  }
}
