/**
 * Net Worth Value Object
 * Represents a validated net worth amount with business rules
 */
export class NetWorth {
  private static readonly MIN_NET_WORTH = 1; // Minimum 1 SOL
  private static readonly MAX_NET_WORTH = 1000000; // Maximum 1M SOL

  private constructor(private readonly value: number) {}

  /**
   * Create a validated net worth
   */
  static create(value: number): NetWorth {
    if (!Number.isFinite(value) || value < this.MIN_NET_WORTH) {
      throw new Error(`Net worth must be at least ${this.MIN_NET_WORTH} SOL`);
    }

    if (value > this.MAX_NET_WORTH) {
      throw new Error(`Net worth cannot exceed ${this.MAX_NET_WORTH} SOL`);
    }

    return new NetWorth(value);
  }

  /**
   * Get the net worth value
   */
  public getValue(): number {
    return this.value;
  }

  /**
   * Get formatted net worth for display
   */
  public getFormatted(): string {
    return `${this.value.toFixed(2)} SOL`;
  }

  /**
   * Check if net worth is considered high (> 100 SOL)
   */
  public isHigh(): boolean {
    return this.value > 100;
  }

  /**
   * Calculate recommended max position size (20% of net worth)
   */
  public getMaxRecommendedPositionSize(): number {
    return this.value * 0.2;
  }
}
