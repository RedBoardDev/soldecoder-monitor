import type { ILpAgentService } from '@shared/application/interfaces/lpagent.service.interface';
import type { IPortfolioService } from '@shared/application/interfaces/portfolio.service.interface';
import { time } from '@shared/domain';
import { WalletAddress } from '@shared/domain/value-objects/wallet-address.vo';
import type { GuildSettingsEntity } from '@soldecoder-monitor/data';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { ProcessedGuild, ProcessSummaryResult } from '../../domain/types/processed-guild.types';
import type { SummaryType } from '../../domain/types/summary.types';
import type { SummaryData } from '../../domain/types/summary-data.types';
import { SummaryContextVO } from '../../domain/value-objects/summary-context.vo';
import { extractSummaryData } from '../mappers/summary-data.mapper';
import type { GetAllGuildConfigsUseCase } from './get-all-guild-configs.use-case';

const logger = createFeatureLogger('process-summary-use-case');

export class ProcessSummaryUseCase {
  constructor(
    private readonly getAllGuildConfigsUseCase: GetAllGuildConfigsUseCase,
    private readonly lpAgentAdapter: ILpAgentService,
    private readonly portfolioService: IPortfolioService,
  ) {}

  async execute(summaryContext: SummaryContextVO): Promise<ProcessSummaryResult> {
    try {
      const eligibleGuilds = await this.getEligibleGuilds(summaryContext.type);

      if (eligibleGuilds.length === 0) {
        return {
          isSuccess: true,
          processedGuilds: [],
        };
      }

      const processedGuilds = await this.processAllGuilds(summaryContext, eligibleGuilds);

      return {
        isSuccess: true,
        processedGuilds,
      };
    } catch (error) {
      logger.error(`❌ ${summaryContext.typeLabel.toLowerCase()} summary processing failed`, error as Error);
      return {
        isSuccess: false,
        processedGuilds: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async getEligibleGuilds(summaryType: SummaryType): Promise<GuildSettingsEntity[]> {
    const allGuildConfigs = await this.getAllGuildConfigsUseCase.execute();

    return allGuildConfigs.filter((guild) => {
      if (!guild.guildId || !guild.globalChannelId || !guild.hasSummaryEnabled()) {
        return false;
      }

      return SummaryContextVO.isGuildEligible(summaryType, guild.summaryPreferences);
    });
  }

  private async processAllGuilds(
    summaryContext: SummaryContextVO,
    guilds: GuildSettingsEntity[],
  ): Promise<ProcessedGuild[]> {
    const processedGuilds: ProcessedGuild[] = [];

    for (const guild of guilds) {
      try {
        const summaryData = await this.processGuildSummary(summaryContext, guild);

        processedGuilds.push({
          guildConfig: guild,
          summaryData,
          success: true,
        });
      } catch (error) {
        processedGuilds.push({
          guildConfig: guild,
          summaryData: null,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // Wait before processing the next guild to avoid rate limits
      if (guild !== guilds[guilds.length - 1]) {
        await new Promise((resolve) => setTimeout(resolve, time.seconds(30)));
      }
    }

    return processedGuilds;
  }

  private async processGuildSummary(
    summaryContext: SummaryContextVO,
    guildConfig: GuildSettingsEntity,
  ): Promise<SummaryData> {
    try {
      if (!guildConfig.positionSizeDefaults.walletAddress) {
        throw new Error('Wallet address is not set');
      }

      const wallet = WalletAddress.create(guildConfig.positionSizeDefaults.walletAddress);
      const overviewResponse = await this.lpAgentAdapter.getOverview(wallet);
      const overview = overviewResponse.data;

      const totalNetWorth = await this.portfolioService.getTotalNetWorth(wallet);

      return extractSummaryData(overview, summaryContext, totalNetWorth);
    } catch (error) {
      logger.error(
        `❌ Failed to process ${summaryContext.typeLabel} summary for guild: ${guildConfig.guildId}`,
        error as Error,
      );
      throw error;
    }
  }
}
