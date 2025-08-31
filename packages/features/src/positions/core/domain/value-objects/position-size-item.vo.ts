/**
 * Position Size Item Value Object
 * Represents a calculated position size recommendation for a specific number of positions
 */
export class PositionSizeItem {
  constructor(
    public readonly positions: number,
    public readonly size: number,
    public readonly sl: number,
    public readonly delta?: number | null,
  ) {}

  /**
   * Create a position size item with validation
   */
  static create(positions: number, size: number, sl: number, delta?: number | null): PositionSizeItem {
    if (positions < 1 || positions > 6) {
      throw new Error('Position count must be between 1 and 6');
    }

    if (size < 0) {
      throw new Error('Position size cannot be negative');
    }

    if (sl < 0) {
      throw new Error('Stop loss amount cannot be negative');
    }

    return new PositionSizeItem(positions, size, sl, delta);
  }

  /**
   * Get formatted size string
   */
  public getFormattedSize(): string {
    return `${this.size.toFixed(2)} SOL`;
  }

  /**
   * Get formatted stop loss string
   */
  public getFormattedStopLoss(): string {
    return `${this.sl.toFixed(2)} SOL`;
  }

  /**
   * Get formatted delta string if available
   */
  public getFormattedDelta(): string | null {
    if (this.delta === null || this.delta === undefined) {
      return null;
    }
    const sign = this.delta >= 0 ? '+' : '';
    return `${sign}${this.delta.toFixed(2)}%`;
  }

  /**
   * Get trend icon for delta
   */
  public getTrendIcon(): string {
    if (this.delta === null || this.delta === undefined) {
      return '';
    }
    if (this.delta > 0.01) return '🔺';
    if (this.delta < -0.01) return '🔻';
    return '➖';
  }

  /**
   * Check if this item has delta calculation
   */
  public hasDelta(): boolean {
    return this.delta !== null && this.delta !== undefined;
  }

  /**
   * Convert to plain object for serialization
   */
  public toPlainObject(): {
    positions: number;
    size: number;
    sl: number;
    delta?: number | null;
  } {
    return {
      positions: this.positions,
      size: this.size,
      sl: this.sl,
      delta: this.delta,
    };
  }
}
