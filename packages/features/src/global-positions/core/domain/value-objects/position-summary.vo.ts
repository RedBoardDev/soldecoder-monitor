import type { PositionStatus } from './position-status.vo';

/**
 * Position Summary Value Object
 * Encapsulates the business logic for calculating position summaries
 */
export class PositionSummary {
  private constructor(
    public readonly totalPositions: number,
    public readonly totalPnL: number,
    public readonly averagePnL: number,
    public readonly walletCount: number,
  ) {}

  static create(positionsByWallet: Map<string, PositionStatus[]>): PositionSummary {
    let totalPositions = 0;
    let totalPnL = 0;

    for (const positions of positionsByWallet.values()) {
      totalPositions += positions.length;
      totalPnL += positions.reduce((sum, pos) => sum + pos.pnl, 0);
    }

    const averagePnL = totalPositions > 0 ? totalPnL / totalPositions : 0;
    const walletCount = positionsByWallet.size;

    return new PositionSummary(totalPositions, totalPnL, averagePnL, walletCount);
  }

  public getSummaryIcon(): string {
    if (this.totalPnL > 0) return '🟢';
    if (this.totalPnL < 0) return '🔴';
    return '⚪';
  }

  public getPositionsText(): string {
    const suffix = this.totalPositions !== 1 ? 's' : '';
    return `**${this.totalPositions} position${suffix}**`;
  }

  public getPnLText(percentOnly: boolean): string {
    const sign = this.totalPnL >= 0 ? '+' : '';
    const solAmount = percentOnly ? '•••' : `${this.totalPnL.toFixed(2)}`;
    const avgSign = this.averagePnL >= 0 ? '+' : '';

    return `└ Total PnL: ${sign}${solAmount} SOL (**${avgSign}${this.averagePnL.toFixed(2)}%**)`;
  }

  public getSummaryText(percentOnly: boolean): string {
    const positionsLine = `${this.getSummaryIcon()} ${this.getPositionsText()}`;
    const pnlLine = this.getPnLText(percentOnly);

    return `${positionsLine}\n${pnlLine}`;
  }
}
