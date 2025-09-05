import type { ILpAgentService } from '@shared/application/interfaces/lpagent.service.interface';
import { WalletAddress } from '@shared/domain/value-objects/wallet-address.vo';
import type { GuildSettingsEntity } from '@soldecoder-monitor/data';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import { extractSummaryData } from '../../core/application/mappers/summary-data.mapper';
import type { GetAllGuildConfigsUseCase } from '../../core/application/use-cases/get-all-guild-configs.use-case';
import type { SummaryType } from '../../core/domain/types/summary.types';
import type { SummaryData } from '../../core/domain/types/summary-data.types';
import { SummaryContextVO } from '../../core/domain/value-objects/summary-context.vo';

const logger = createFeatureLogger('summary-scheduler-handler');

/**
 * Handler for summary schedulers (weekly and monthly).
 * Processes all guild configurations for the specified summary type.
 */
export class SummarySchedulerHandler {
  constructor(
    private readonly getAllGuildConfigsUseCase: GetAllGuildConfigsUseCase,
    private readonly lpAgentAdapter: ILpAgentService,
  ) {}

  /**
   * Execute the summary process with the provided system context
   * @param systemContext The system context containing summary type and execution details
   */
  async execute(systemContext: SummaryContextVO): Promise<void> {
    try {
      const eligibleGuilds = await this.getEligibleGuilds(systemContext.type);

      if (eligibleGuilds.length === 0) return;

      await this.processAllGuilds(systemContext, eligibleGuilds);
    } catch (error) {
      logger.error(`❌ ${systemContext.typeLabel.toLowerCase()} summary scheduler failed`, error as Error);
      throw error;
    }
  }

  private async getEligibleGuilds(summaryType: SummaryType): Promise<GuildSettingsEntity[]> {
    const allGuildConfigs = await this.getAllGuildConfigsUseCase.execute();

    return allGuildConfigs.filter((guild) => {
      if (!guild.guildId || !guild.globalChannelId || !guild.hasSummaryEnabled) {
        return false;
      }

      return SummaryContextVO.isGuildEligible(summaryType, guild.summaryPreferences);
    });
  }

  /**
   * Process all guilds for the summary
   */
  private async processAllGuilds(systemContext: SummaryContextVO, guilds: GuildSettingsEntity[]): Promise<void> {
    const results = await Promise.allSettled(guilds.map((guild) => this.processGuildSummary(systemContext, guild)));

    const successful = results.filter((result) => result.status === 'fulfilled').length;
    const failed = results.filter((result) => result.status === 'rejected').length;

    logger.info(`📈 Summary processing results: ${successful} successful, ${failed} failed`);
  }

  private async processGuildSummary(summaryContext: SummaryContextVO, guildConfig: GuildSettingsEntity): Promise<void> {
    try {
      if (!guildConfig.positionSizeDefaults.walletAddress) {
        throw new Error('Wallet address is not set');
      }

      const wallet = WalletAddress.create(guildConfig.positionSizeDefaults.walletAddress);
      await this.executeGuildSummary(summaryContext, guildConfig, wallet);
    } catch (error) {
      logger.warn(`❌ Failed to process ${summaryContext.typeLabel} summary for guild: ${guildConfig.guildId}`, {
        summaryType: summaryContext.type,
        guildId: guildConfig.guildId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Execute the actual summary logic for a guild
   * This is where you'll implement your business logic
   */
  private async executeGuildSummary(
    summaryContext: SummaryContextVO,
    guildConfig: GuildSettingsEntity,
    wallet: WalletAddress,
  ): Promise<void> {
    try {
      logger.debug(`🔄 Processing ${summaryContext.typeLabel} summary for guild: ${guildConfig.guildId}`);

      // Fetch overview data from LpAgent
      const overviewResponse = await this.lpAgentAdapter.getOverview(wallet);
      const overview = overviewResponse.data;

      // Extract period-specific data based on summary type (7D for weekly, 1M for monthly)
      const summaryData = extractSummaryData(overview, summaryContext);

      logger.debug(`📊 Extracted ${summaryContext.typeLabel} summary data`, {
        guildId: guildConfig.guildId,
        period: summaryContext.periodDescription,
        totalPnlNative: summaryData.totalPnlNative,
        winRateNative: summaryData.winRateNative,
        closedLp: summaryData.closedLp,
      });

      // TODO: Generate and send summary message to Discord
      await this.generateAndSendSummary(summaryContext, guildConfig, summaryData);

      logger.debug(`✅ ${summaryContext.typeLabel} summary completed for guild: ${guildConfig.guildId}`);
    } catch (error) {
      logger.error(
        `❌ Failed to process ${summaryContext.typeLabel} summary for guild: ${guildConfig.guildId}`,
        error as Error,
      );
      throw error;
    }
  }

  /**
   * Generate and send summary message to Discord
   */
  private async generateAndSendSummary(
    summaryContext: SummaryContextVO,
    guildConfig: GuildSettingsEntity,
    summaryData: SummaryData,
  ): Promise<void> {
    // TODO: Implement summary message generation and Discord sending
    logger.info(`🎯 Would generate ${summaryContext.typeLabel} summary for guild: ${guildConfig.guildId}`, {
      totalPnlNative: summaryData.totalPnlNative,
      winRateNative: summaryData.winRateNative,
      closedLp: summaryData.closedLp,
    });
  }
}
