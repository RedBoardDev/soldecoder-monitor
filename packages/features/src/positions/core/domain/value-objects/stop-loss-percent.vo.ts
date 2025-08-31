/**
 * Stop Loss Percent Value Object
 * Represents a validated stop loss percentage with business rules
 */
export class StopLossPercent {
  private static readonly MIN_PERCENT = 0.1; // Minimum 0.1%
  private static readonly MAX_PERCENT = 100; // Maximum 100%

  private constructor(private readonly value: number) {}

  /**
   * Create a validated stop loss percentage
   */
  static create(value: number): StopLossPercent {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error('Stop loss percent must be a positive number');
    }

    if (value < this.MIN_PERCENT) {
      throw new Error(`Stop loss percent must be at least ${this.MIN_PERCENT}%`);
    }

    if (value > this.MAX_PERCENT) {
      throw new Error(`Stop loss percent cannot exceed ${this.MAX_PERCENT}%`);
    }

    return new StopLossPercent(value);
  }

  /**
   * Get the percentage value
   */
  public getValue(): number {
    return this.value;
  }

  /**
   * Get formatted percentage for display
   */
  public getFormatted(): string {
    return `${this.value}%`;
  }

  /**
   * Check if this is a conservative stop loss (< 5%)
   */
  public isConservative(): boolean {
    return this.value < 5;
  }

  /**
   * Check if this is an aggressive stop loss (> 20%)
   */
  public isAggressive(): boolean {
    return this.value > 20;
  }

  /**
   * Calculate stop loss amount for a given position size
   */
  public calculateStopLossAmount(positionSize: number): number {
    return (positionSize * this.value) / 100;
  }
}
