/**
 * Rich Value Object representing a closed position with complete performance and metadata
 */
export class ClosedPosition {
  constructor(
    public readonly tokenName0: string,
    public readonly tokenName1: string,
    public readonly pnlPercentageSol: number,
    public readonly pnlPercentageUsd: number,
    public readonly pnlSol: number,
    public readonly pnlUsd: number,
    public readonly valueSol: number,
    public readonly valueUsd: number,
    public readonly durationHours: number,
  ) {
    if (!tokenName0.trim()) {
      throw new Error('Token0 symbol cannot be empty');
    }
    if (!tokenName1.trim()) {
      throw new Error('Token1 symbol cannot be empty');
    }
    if (durationHours < 0) {
      throw new Error('Duration cannot be negative');
    }
  }

  /**
   * Checks if position meets the configured threshold
   * @param threshold - Threshold configuration from channel config
   * @param triggerType - Type of trigger ('take_profit' | 'stop_loss' | null)
   */
  meetsThreshold(threshold: number | string | null, triggerType: 'take_profit' | 'stop_loss' | null = null): boolean {
    if (threshold === null) return true;

    // Legacy numeric threshold
    if (typeof threshold === 'number') {
      return Math.abs(this.pnlPercentageSol) >= threshold;
    }

    // String-based threshold logic
    switch (threshold) {
      case 'TP':
        return triggerType === 'take_profit';
      case 'SL':
        return triggerType === 'stop_loss';
      case 'TP/SL':
        return triggerType === 'take_profit' || triggerType === 'stop_loss';
      default:
        return false;
    }
  }

  get pairName(): string {
    return `${this.tokenName0}/${this.tokenName1}`;
  }

  get isInProfit(): boolean {
    return this.pnlPercentageSol > 0;
  }

  get isInLoss(): boolean {
    return this.pnlPercentageSol < 0;
  }

  get absolutePnL(): number {
    return Math.abs(this.pnlPercentageSol);
  }

  get formattedPnL(): string {
    const sign = this.isInProfit ? '+' : '-';
    return `${sign}${this.pnlPercentageSol.toFixed(2)}%`;
  }

  get pnLEmoji(): string {
    if (this.isInProfit) return '🟢';
    if (this.isInLoss) return '🔴';
    return '⚪';
  }

  get netResult(): { usd: number; sol: number } {
    return {
      usd: this.pnlUsd,
      sol: this.pnlSol,
    };
  }

  get positionTVL(): { usd: number; sol: number } {
    return {
      usd: this.valueUsd,
      sol: this.valueSol,
    };
  }

  get formattedDuration(): string {
    const hours = Math.floor(this.durationHours);
    const minutes = Math.round((this.durationHours - hours) * 60);

    if (hours === 0) return `${minutes}mn`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h${minutes.toString().padStart(2, '0')}mn`;
  }
}
