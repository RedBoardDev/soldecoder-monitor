/**
 * Stop Loss Percent Value Object
 * Represents a validated stop loss percentage with business rules
 */
export class StopLossPercent {
  private static readonly MIN_PERCENT = 0.1;
  private static readonly MAX_PERCENT = 100;

  private constructor(private readonly value: number) {}

  static create(value: number): StopLossPercent {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error('Stop loss percent must be a positive number');
    }

    if (value < StopLossPercent.MIN_PERCENT) {
      throw new Error(`Stop loss percent must be at least ${StopLossPercent.MIN_PERCENT}%`);
    }

    if (value > StopLossPercent.MAX_PERCENT) {
      throw new Error(`Stop loss percent cannot exceed ${StopLossPercent.MAX_PERCENT}%`);
    }

    return new StopLossPercent(value);
  }

  public getValue(): number {
    return this.value;
  }

  public getFormatted(): string {
    return `${this.value}%`;
  }

  public isConservative(): boolean {
    return this.value < 5;
  }

  public isAggressive(): boolean {
    return this.value > 20;
  }

  public calculateStopLossAmount(positionSize: number): number {
    return (positionSize * this.value) / 100;
  }
}
