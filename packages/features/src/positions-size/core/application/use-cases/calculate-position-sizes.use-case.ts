import type { GuildSettingsRepository } from '@soldecoder-monitor/data';
import { GuildSettingsNotFoundError } from '@soldecoder-monitor/data';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { IWalletInfoService } from '../../../../shared/application';
import { InvalidWalletAddressError, WalletAddress } from '../../../../shared/domain';
import { MissingPositionConfigurationError } from '../../domain/position-size.errors';
import { calculateAllPositionRecommendations } from '../../domain/services/position-size-calculator.service';
import { NetWorth } from '../../domain/value-objects/net-worth.vo';
import { StopLossPercent } from '../../domain/value-objects/stop-loss-percent.vo';
import type { CalculatePositionSizesCommand } from '../commands/calculate-position-sizes.command';
import { PositionSizeCalculationsResult } from '../results/position-size-calculations.result';

const logger = createFeatureLogger('calculate-position-sizes-use-case');

/**
 * Use Case: Calculate Position Sizes
 * Orchestrates the business logic of resolving settings and calculating position size recommendations
 */
export class CalculatePositionSizesUseCase {
  constructor(
    private readonly guildSettingsRepository: GuildSettingsRepository,
    private readonly walletInfoService: IWalletInfoService,
  ) {}

  /**
   * Execute the use case
   * @param command Input parameters
   * @returns Position size calculations result (with or without calculations)
   * @throws MissingPositionConfigurationError if required settings are missing
   * @throws InvalidWalletAddressError if wallet address is invalid
   * @throws GuildSettingsNotFoundError if guild has no settings
   */
  async execute(command: CalculatePositionSizesCommand): Promise<PositionSizeCalculationsResult> {
    // 1. Get guild settings
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

    // 5. Create value objects for domain calculations
    let stopLossVO: StopLossPercent;
    try {
      stopLossVO = StopLossPercent.create(stoplossToUse);
    } catch (_error) {
      throw new MissingPositionConfigurationError('stoploss', command.guildId);
    }

    // 6. Attempt to get wallet info and calculate recommendations
    try {
      const totalNetWorth = await this.walletInfoService.getTotalNetWorth(walletVO.getValue());
      const netWorthVO = NetWorth.create(totalNetWorth);

      const positionItems = calculateAllPositionRecommendations(netWorthVO, stopLossVO, command.currentSize);

      logger.debug('Position calculations completed successfully', {
        guildId: command.guildId,
        totalNetWorth,
        itemsCalculated: positionItems.length,
        hasCurrentSize: command.hasCurrentSize(),
      });

      return new PositionSizeCalculationsResult(
        walletVO.getValue(),
        stopLossVO.getValue(),
        command.currentSize ?? null,
        command.guildId,
        { wallet: usedWalletDefault, stoploss: usedStoplossDefault },
        totalNetWorth,
        positionItems,
      );
    } catch (walletError) {
      logger.warn('Failed to fetch wallet info, returning settings without calculations', {
        guildId: command.guildId,
        walletAddress: walletVO.getShortAddress(),
        error: walletError instanceof Error ? walletError.message : 'Unknown error',
      });

      // Return result without calculations (fallback mode)
      return new PositionSizeCalculationsResult(
        walletVO.getValue(),
        stopLossVO.getValue(),
        command.currentSize ?? null,
        command.guildId,
        { wallet: usedWalletDefault, stoploss: usedStoplossDefault },
      );
    }
  }
}
