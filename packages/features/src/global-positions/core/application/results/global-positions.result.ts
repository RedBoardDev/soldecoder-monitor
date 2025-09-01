import type { PositionStatus } from '../../domain/value-objects/position-status.vo';

/**
 * Result DTO for global positions retrieval
 * Contains all positions grouped by wallet with summary statistics
 */
export class GlobalPositionsResult {
  constructor(
    public readonly guildId: string,
    public readonly positionsByWallet: Map<string, PositionStatus[]>,
    public readonly totalPositions: number,
    public readonly totalPnL: number,
    public readonly percentOnly: boolean,
  ) {}

  public getWalletNames(): string[] {
    return Array.from(this.positionsByWallet.keys());
  }

  public getPositionsForWallet(walletName: string): PositionStatus[] {
    return this.positionsByWallet.get(walletName) || [];
  }

  public hasPositions(): boolean {
    return this.totalPositions > 0;
  }

  public getAveragePnL(): number {
    if (this.totalPositions === 0) return 0;
    return this.totalPnL / this.totalPositions;
  }

  public isPercentOnlyMode(): boolean {
    return this.percentOnly;
  }

  public getSummary(): {
    totalPositions: number;
    totalPnL: number;
    averagePnL: number;
    walletCount: number;
  } {
    return {
      totalPositions: this.totalPositions,
      totalPnL: this.totalPnL,
      averagePnL: this.getAveragePnL(),
      walletCount: this.positionsByWallet.size,
    };
  }
}
