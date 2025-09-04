import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { GetAllGuildConfigsUseCase } from '../../core/application/use-cases/get-all-guild-configs.use-case';
import { SummaryContextVO } from '../../core/domain/value-objects/summary-context.vo';
import type { SummaryType } from '../../core/domain/types/summary.types';

const logger = createFeatureLogger('summary-scheduler-handler');

/**
 * Handler for summary schedulers (weekly and monthly).
 * Processes all guild configurations for the specified summary type.
 */
export class SummarySchedulerHandler {
  constructor(private readonly getAllGuildConfigsUseCase: GetAllGuildConfigsUseCase) {}

  /**
   * Execute the summary process for the specified type
   * @param type The type of summary to execute ('weekly' or 'monthly')
   */
  async execute(type: SummaryType): Promise<void> {
    try {
      const contextVO = SummaryContextVO[type === 'weekly' ? 'weekly' : 'monthly']('system');
      logger.info(`Starting ${contextVO.getTypeLabel().toLowerCase()} summary process`);

      // Retrieve all guild configurations
      const allGuildConfigs = await this.getAllGuildConfigsUseCase.execute();

      // Filter guilds that have summaries enabled (you can add this field later)
      const eligibleGuilds = allGuildConfigs.filter(
        (guild) => guild.guildId && guild.positionDisplayEnabled, // Add your specific criteria
      );

      if (eligibleGuilds.length === 0) {
        logger.debug(`No eligible guilds found for ${type} summary`);
        return;
      }

      logger.info(`Processing ${type} summary for ${eligibleGuilds.length} guilds`, {
        summaryType: type,
        guildCount: eligibleGuilds.length,
        guildIds: eligibleGuilds.map((g) => g.guildId),
      });

      // TODO: Process each guild for summary
      // This is where you'll add the actual summary generation logic
      for (const guildConfig of eligibleGuilds) {
        try {
          const guildContext = new SummaryContextVO(type, guildConfig.guildId);
          logger.debug(`Processing ${type} summary for guild: ${guildConfig.guildId}`, {
            summaryType: type,
            guildId: guildConfig.guildId,
            period: guildContext.getPeriodDescription(),
          });

          // TODO: Add your summary processing logic here
          // This could include:
          // - Fetching position data for the period
          // - Calculating statistics
          // - Generating summary messages
          // - Sending to configured channels

          await this.processGuildSummary(guildContext, guildConfig);
        } catch (error) {
          logger.warn(`Failed to process ${type} summary for guild: ${guildConfig.guildId}`, {
            summaryType: type,
            guildId: guildConfig.guildId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      logger.info(`${contextVO.getTypeLabel()} summary process completed successfully`);
    } catch (error) {
      logger.error(`${type} summary scheduler failed`, error as Error);
      throw error;
    }
  }

  /**
   * Process summary for a specific guild
   * @param context Summary execution context
   * @param guildConfig Guild configuration
   */
  private async processGuildSummary(context: SummaryContextVO, _guildConfig: { guildId: string }): Promise<void> {
    // TODO: Implement the actual summary processing logic
    // This is a placeholder for your future implementation

    logger.debug(`${context.getTypeLabel()} summary processing placeholder for guild: ${context.guildId}`, {
      summaryType: context.type,
      guildId: context.guildId,
      period: context.getPeriodDescription(),
      executedAt: context.executedAt.toISOString(),
    });

    // You can remove this placeholder once you implement the actual logic
    // For now, it just logs that it would process this guild
  }
}
