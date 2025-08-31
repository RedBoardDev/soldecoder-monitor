/**
 * Position Count Value Object
 * Represents a validated position count with business rules
 */
export class PositionCount {
  private static readonly MIN_POSITIONS = 1;
  private static readonly MAX_POSITIONS = 6;

  private constructor(private readonly value: number) {}

  /**
   * Create a validated position count
   */
  static create(value: number): PositionCount {
    if (!Number.isInteger(value)) {
      throw new Error('Position count must be a whole number');
    }

    if (value < this.MIN_POSITIONS) {
      throw new Error(`Position count must be at least ${this.MIN_POSITIONS}`);
    }

    if (value > this.MAX_POSITIONS) {
      throw new Error(`Position count cannot exceed ${this.MAX_POSITIONS}`);
    }

    return new PositionCount(value);
  }

  /**
   * Get the position count value
   */
  public getValue(): number {
    return this.value;
  }

  /**
   * Get all valid position counts up to this value
   */
  public getAllCountsUpTo(): number[] {
    return Array.from({ length: this.value }, (_, i) => i + 1);
  }

  /**
   * Check if this represents multiple positions
   */
  public isMultiple(): boolean {
    return this.value > 1;
  }

  /**
   * Get display name for position count
   */
  public getDisplayName(): string {
    return `${this.value} position${this.isMultiple() ? 's' : ''}`;
  }

  /**
   * Get emoji representation
   */
  public getEmoji(): string {
    const emojiMap: Record<number, string> = {
      1: '1️⃣',
      2: '2️⃣',
      3: '3️⃣',
      4: '4️⃣',
      5: '5️⃣',
      6: '6️⃣',
    };
    return emojiMap[this.value] || `${this.value}`;
  }

  /**
   * Create all valid position counts (1-6)
   */
  static createAll(): PositionCount[] {
    return Array.from({ length: this.MAX_POSITIONS }, (_, i) => new PositionCount(i + 1));
  }
}
