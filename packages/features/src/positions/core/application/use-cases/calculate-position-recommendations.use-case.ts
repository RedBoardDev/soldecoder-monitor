import type { GuildSettingsRepository } from '@soldecoder-monitor/data';
import { GuildSettingsNotFoundError } from '@soldecoder-monitor/data';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { IWalletInfoService } from '../../../../shared/application';
import { InvalidWalletAddressError, WalletAddress } from '../../../../shared/domain';
import { calculatePositionItems, MissingPositionConfigurationError } from '../../domain';
import type { GetPositionSettingsCommand } from '../commands/get-position-settings.command';
import { PositionRecommendationsResult } from '../results/position-recommendations.result';
import { PositionSettingsOnlyResult } from '../results/position-settings-only.result';

const logger = createFeatureLogger('position-settings-use-case');

/**
 * Use Case: Calculate Position Recommendations
 * Orchestrates the business logic of resolving position settings and calculating position size recommendations
 */
export class CalculatePositionRecommendationsUseCase {
  constructor(
    private readonly guildSettingsRepository: GuildSettingsRepository,
    private readonly walletInfoService: IWalletInfoService,
  ) {}

  /**
   * Execute the use case
   * @param command Input parameters
   * @returns Position recommendations with calculations, or settings only if wallet service fails
   * @throws MissingPositionConfigurationError if required settings are missing
   * @throws InvalidWalletAddressError if wallet address is invalid
   * @throws GuildSettingsNotFoundError if guild has no settings
   */
  async execute(command: GetPositionSettingsCommand): Promise<PositionRecommendationsResult | PositionSettingsOnlyResult> {
    // 1. Get guild settings (with caching automatically handled)
    const guildSettings = await this.guildSettingsRepository.getByGuildId(command.guildId);

    if (!guildSettings) {
      throw new GuildSettingsNotFoundError(command.guildId);
    }

    // 2. Resolve wallet address (override or default)
    const defaultWallet = guildSettings.positionSizeDefaults.walletAddress;
    const walletToUse = command.walletOverride || defaultWallet;
    const usedWalletDefault = !command.hasWalletOverride();

    if (!walletToUse) {
      throw new MissingPositionConfigurationError('wallet', command.guildId);
    }

    // 3. Validate wallet address
    let walletVO: WalletAddress;
    try {
      walletVO = WalletAddress.create(walletToUse);
    } catch (error) {
      if (error instanceof InvalidWalletAddressError) {
        throw error;
      }
      throw new InvalidWalletAddressError(walletToUse);
    }

    // 4. Resolve stoploss percent (override or default)
    const defaultStoploss = guildSettings.positionSizeDefaults.stopLossPercent;
    const stoplossToUse = command.stoplossOverride ?? defaultStoploss;
    const usedStoplossDefault = !command.hasStoplossOverride();

    if (stoplossToUse === null || stoplossToUse === undefined) {
      throw new MissingPositionConfigurationError('stoploss', command.guildId);
    }

    // 5. Validate stoploss range
    if (!Number.isFinite(stoplossToUse) || stoplossToUse <= 0 || stoplossToUse > 100) {
      throw new MissingPositionConfigurationError('stoploss', command.guildId);
    }

    // 6. Get wallet net worth and calculate position recommendations
    try {
      const totalNetWorth = await this.walletInfoService.getTotalNetWorth(walletVO.getValue());
      const positionItems = calculatePositionItems(
        totalNetWorth,
        stoplossToUse,
        command.currentSize,
        6, // Calculate for 1-6 positions
      );

      logger.debug('Position calculations completed', {
        guildId: command.guildId,
        totalNetWorth,
        itemsCalculated: positionItems.length,
      });

      const result = new PositionRecommendationsResult(
        walletVO.getValue(),
        stoplossToUse,
        command.currentSize ?? null,
        command.guildId,
        {
          wallet: usedWalletDefault,
          stoploss: usedStoplossDefault,
        },
        totalNetWorth,
        positionItems,
      );

      logger.info('Position recommendations calculated successfully', {
        guildId: command.guildId,
        shortWallet: walletVO.getShortAddress(),
        stoploss: stoplossToUse,
        totalNetWorth,
        itemsCalculated: positionItems.length,
        defaultsUsed: result.getDefaultsUsageSummary(),
      });

      return result;
    } catch (error) {
      logger.warn('Failed to fetch wallet info or calculate positions, returning settings only', {
        guildId: command.guildId,
        walletAddress: walletVO.getShortAddress(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Fallback to settings-only result
      const result = new PositionSettingsOnlyResult(
        walletVO.getValue(),
        stoplossToUse,
        command.currentSize ?? null,
        command.guildId,
        {
          wallet: usedWalletDefault,
          stoploss: usedStoplossDefault,
        },
      );

      logger.info('Position settings resolved (without calculations)', {
        guildId: command.guildId,
        shortWallet: walletVO.getShortAddress(),
        stoploss: stoplossToUse,
        defaultsUsed: result.getDefaultsUsageSummary(),
      });

      return result;
    }
  }
}
