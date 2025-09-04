import type { WalletAddress } from '@shared/domain';

/**
 * Rich Value Object representing a closed position with complete performance and metadata
 */
export class ClosedPosition {
  constructor(
    public readonly walletAddress: WalletAddress,
    public readonly token0Symbol: string,
    public readonly token1Symbol: string,
    public readonly pnlPercentageSol: number,
    public readonly pnlPercentageUsd: number,
    public readonly pnlSol: number,
    public readonly pnlUsd: number,
    public readonly valueSol: number,
    public readonly valueUsd: number,
    public readonly durationHours: number,
    public readonly positionAddress?: string,
  ) {
    if (!token0Symbol.trim()) {
      throw new Error('Token0 symbol cannot be empty');
    }
    if (!token1Symbol.trim()) {
      throw new Error('Token1 symbol cannot be empty');
    }
    if (durationHours < 0) {
      throw new Error('Duration cannot be negative');
    }
  }

  meetsThreshold(threshold: number): boolean {
    return Math.abs(this.pnlPercentageSol) >= threshold;
  }

  pairName(): string {
    return `${this.token0Symbol}-${this.token1Symbol}`;
  }

  isInProfit(): boolean {
    return this.pnlPercentageSol > 0;
  }

  isInLoss(): boolean {
    return this.pnlPercentageSol < 0;
  }

  getAbsolutePnL(): number {
    return Math.abs(this.pnlPercentageSol);
  }

  getFormattedPnL(): string {
    const sign = this.isInProfit() ? '+' : '-';
    return `${sign}${this.pnlPercentageSol.toFixed(2)}%`;
  }

  getPnLEmoji(): string {
    if (this.isInProfit()) return '🟢';
    if (this.isInLoss()) return '🔴';
    return '⚪';
  }

  getNetResult(): { usd: number; sol: number } {
    return {
      usd: this.pnlUsd,
      sol: this.pnlSol,
    };
  }

  getTVL(): { usd: number; sol: number } {
    return {
      usd: this.valueUsd,
      sol: this.valueSol,
    };
  }

  getFormattedDuration(): string {
    const hours = Math.floor(this.durationHours);
    const minutes = Math.round((this.durationHours - hours) * 60);

    if (hours === 0) return `${minutes}mn`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h${minutes.toString().padStart(2, '0')}mn`;
  }
}
