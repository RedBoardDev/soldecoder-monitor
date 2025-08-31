/**
 * Result DTO for position settings only (fallback when calculations fail)
 * Contains resolved settings with defaults applied but no calculations
 */
export class PositionSettingsOnlyResult {
  constructor(
    public readonly walletAddress: string,
    public readonly stopLossPercent: number,
    public readonly currentSize: number | null,
    public readonly guildId: string,
    public readonly usedDefaults: {
      wallet: boolean;
      stoploss: boolean;
    },
  ) {}

  /**
   * Get short wallet address for display (first 4 + last 4 chars)
   */
  public getShortWalletAddress(): string {
    if (this.walletAddress.length <= 8) {
      return this.walletAddress;
    }
    return `${this.walletAddress.slice(0, 4)}...${this.walletAddress.slice(-4)}`;
  }

  /**
   * Get defaults usage summary for display
   */
  public getDefaultsUsageSummary(): string {
    const used = [];
    if (this.usedDefaults.wallet) used.push('wallet');
    if (this.usedDefaults.stoploss) used.push('stoploss');

    return used.length > 0 ? `Used defaults: ${used.join(', ')}` : 'No defaults used';
  }

  /**
   * Check if current size is provided
   */
  public hasCurrentSize(): boolean {
    return this.currentSize !== null;
  }

  /**
   * Check if any defaults were used
   */
  public hasUsedDefaults(): boolean {
    return this.usedDefaults.wallet || this.usedDefaults.stoploss;
  }
}
