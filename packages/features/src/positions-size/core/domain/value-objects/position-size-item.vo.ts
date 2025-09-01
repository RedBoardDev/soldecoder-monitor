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

  public getFormattedSize(): string {
    return `${this.size.toFixed(2)} SOL`;
  }

  public getFormattedStopLoss(): string {
    return `${this.sl.toFixed(2)} SOL`;
  }

  public getFormattedDelta(): string | null {
    if (this.delta === null || this.delta === undefined) {
      return null;
    }
    const sign = this.delta >= 0 ? '+' : '';
    return `${sign}${this.delta.toFixed(2)}%`;
  }

  public getTrendIcon(): string {
    if (this.delta === null || this.delta === undefined) {
      return '';
    }
    if (this.delta > 0.01) return '🔺';
    if (this.delta < -0.01) return '🔻';
    return '➖';
  }

  public hasDelta(): boolean {
    return this.delta !== null && this.delta !== undefined;
  }

  public getPositionEmoji(): string {
    const emojiMap: Record<number, string> = {
      1: '1️⃣',
      2: '2️⃣',
      3: '3️⃣',
      4: '4️⃣',
      5: '5️⃣',
      6: '6️⃣',
    };
    return emojiMap[this.positions] || `${this.positions}`;
  }

  public getPositionDisplayName(): string {
    return `${this.positions} position${this.positions > 1 ? 's' : ''}`;
  }
}
