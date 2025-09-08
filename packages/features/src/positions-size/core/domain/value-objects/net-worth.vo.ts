/**
 * Net Worth Value Object
 *
 * Represents a validated net worth amount with business rules
 */
export class NetWorth {
  private static readonly MIN_NET_WORTH = 1;
  private static readonly MAX_NET_WORTH = 1_000_000;

  private constructor(private readonly value: number) {}

  static create(value: number): NetWorth {
    if (!Number.isFinite(value) || value < NetWorth.MIN_NET_WORTH) {
      throw new Error(`Net worth must be at least ${NetWorth.MIN_NET_WORTH} SOL`);
    }

    if (value > NetWorth.MAX_NET_WORTH) {
      throw new Error(`Net worth cannot exceed ${NetWorth.MAX_NET_WORTH} SOL`);
    }

    return new NetWorth(value);
  }

  public getValue(): number {
    return this.value;
  }

  public getFormatted(): string {
    return `${this.value.toFixed(2)} SOL`;
  }

  public getMaxRecommendedPositionSize(): number {
    return this.value * 0.2;
  }
}
