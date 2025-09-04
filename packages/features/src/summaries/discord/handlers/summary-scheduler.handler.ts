import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { GetAllGuildConfigsUseCase } from '../../core/application/use-cases/get-all-guild-configs.use-case';
import { SummaryContextVO } from '../../core/domain/value-objects/summary-context.vo';
import type { GuildSettingsEntity } from '@soldecoder-monitor/data';

const logger = createFeatureLogger('summary-scheduler-handler');

/**
 * Handler for summary schedulers (weekly and monthly).
 * Processes all guild configurations for the specified summary type.
 */
export class SummarySchedulerHandler {
  constructor(private readonly getAllGuildConfigsUseCase: GetAllGuildConfigsUseCase) {}

  /**
   * Execute the summary process with the provided system context
   * @param systemContext The system context containing summary type and execution details
   */
  async execute(systemContext: SummaryContextVO): Promise<void> {
    try {
      logger.info(`🚀 Starting ${systemContext.getTypeLabel().toLowerCase()} summary process`);

      const eligibleGuilds = await this.getEligibleGuilds();

      if (eligibleGuilds.length === 0) {
        logger.debug(`No eligible guilds found for ${systemContext.getTypeLabel().toLowerCase()} summary`);
        return;
      }

      logger.info(`📊 Processing ${systemContext.getTypeLabel().toLowerCase()} summary for ${eligibleGuilds.length} guilds`);

      await this.processAllGuilds(systemContext, eligibleGuilds);

      logger.info(`✅ ${systemContext.getTypeLabel()} summary process completed successfully`);
    } catch (error) {
      logger.error(`❌ ${systemContext.getTypeLabel().toLowerCase()} summary scheduler failed`, error as Error);
      throw error;
    }
  }

  /**
   * Get eligible guilds for summary processing
   */
  private async getEligibleGuilds(): Promise<GuildSettingsEntity[]> {
    const allGuildConfigs = await this.getAllGuildConfigsUseCase.execute();

    return allGuildConfigs.filter(
      (guild) => guild.guildId && guild.positionDisplayEnabled
    );
  }

  /**
   * Process all guilds for the summary
   */
  private async processAllGuilds(systemContext: SummaryContextVO, guilds: GuildSettingsEntity[]): Promise<void> {
    const results = await Promise.allSettled(
      guilds.map(guild => this.processGuildSummary(systemContext, guild))
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    logger.info(`📈 Summary processing results: ${successful} successful, ${failed} failed`);
  }

  /**
   * Process summary for a specific guild
   * @param systemContext The system context (contains summary type)
   * @param guildConfig Guild configuration
   */
  private async processGuildSummary(systemContext: SummaryContextVO, guildConfig: GuildSettingsEntity): Promise<void> {
    const guildContext = new SummaryContextVO(systemContext.type, guildConfig.guildId);

    try {
      logger.debug(`🔄 Processing ${guildContext.getTypeLabel()} summary for guild: ${guildContext.guildId}`);

      await this.executeGuildSummary(guildContext, guildConfig);

      logger.debug(`✅ ${guildContext.getTypeLabel()} summary completed for guild: ${guildContext.guildId}`);
    } catch (error) {
      logger.warn(`❌ Failed to process ${guildContext.getTypeLabel()} summary for guild: ${guildContext.guildId}`, {
        summaryType: systemContext.type,
        guildId: guildContext.guildId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Execute the actual summary logic for a guild
   * This is where you'll implement your business logic
   */
  private async executeGuildSummary(context: SummaryContextVO, guildConfig: GuildSettingsEntity): Promise<void> {
    // TODO: Implement your summary generation logic here
    // Example:
    // 1. Fetch position data for the period
    // 2. Calculate statistics (PnL, volume, etc.)
    // 3. Generate summary message/embed
    // 4. Send to configured channel

    logger.debug(`📝 ${context.getTypeLabel()} summary placeholder for guild: ${context.guildId}`, {
      summaryType: context.type,
      guildId: context.guildId,
      period: context.getPeriodDescription(),
      executedAt: context.executedAt.toISOString(),
    });

    // Remove this once you implement the actual logic
    await this.placeholderSummaryLogic(context, guildConfig);
  }

  /**
   * Placeholder logic for summary processing
   */
  private async placeholderSummaryLogic(context: SummaryContextVO, guildConfig: GuildSettingsEntity): Promise<void> {
    // This is a temporary placeholder - replace with actual implementation
    logger.info(`🎯 Would process ${context.getTypeLabel()} summary for guild: ${guildConfig.guildId}`);

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
