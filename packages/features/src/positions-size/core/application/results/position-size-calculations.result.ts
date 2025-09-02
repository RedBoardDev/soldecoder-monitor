import type { WalletAddress } from '../../../../shared/domain/value-objects/wallet-address.vo';
import type { PositionSizeItem } from '../../domain/value-objects/position-size-item.vo';

/**
 * Result DTO for position size calculations
 * Contains resolved settings and optional calculated position recommendations
 */
export class PositionSizeCalculationsResult {
  constructor(
    public readonly walletAddress: WalletAddress,
    public readonly stopLossPercent: number,
    public readonly currentSize: number | null,
    public readonly guildId: string,
    public readonly usedDefaults: {
      wallet: boolean;
      stoploss: boolean;
    },
    public readonly totalNetWorth?: number,
    public readonly positionItems?: PositionSizeItem[],
  ) {}

  public getDefaultsUsageSummary(): string {
    const used = [];
    if (this.usedDefaults.wallet) used.push('wallet');
    if (this.usedDefaults.stoploss) used.push('stoploss');

    return used.length > 0 ? `Used defaults: ${used.join(', ')}` : 'No defaults used';
  }

  public hasCurrentSize(): boolean {
    return this.currentSize !== null;
  }

  public hasUsedDefaults(): boolean {
    return this.usedDefaults.wallet || this.usedDefaults.stoploss;
  }

  public hasCalculations(): boolean {
    return this.totalNetWorth !== undefined && this.positionItems !== undefined;
  }

  public getCalculationData(): {
    totalNetWorth: number;
    positionItems: PositionSizeItem[];
  } | null {
    if (!this.hasCalculations() || !this.totalNetWorth || !this.positionItems) {
      return null;
    }
    return {
      totalNetWorth: this.totalNetWorth,
      positionItems: this.positionItems,
    };
  }
}
