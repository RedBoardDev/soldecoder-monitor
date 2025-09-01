/**
 * Position Count Value Object
 * Represents a validated position count with business rules
 */
export class PositionCount {
  private static readonly MIN_POSITIONS = 1;
  private static readonly MAX_POSITIONS = 6;

  private constructor(private readonly value: number) {}

  static create(value: number): PositionCount {
    if (!Number.isInteger(value)) {
      throw new Error('Position count must be a whole number');
    }

    if (value < PositionCount.MIN_POSITIONS) {
      throw new Error(`Position count must be at least ${PositionCount.MIN_POSITIONS}`);
    }

    if (value > PositionCount.MAX_POSITIONS) {
      throw new Error(`Position count cannot exceed ${PositionCount.MAX_POSITIONS}`);
    }

    return new PositionCount(value);
  }

  public getValue(): number {
    return this.value;
  }

  public getAllCountsUpTo(): number[] {
    return Array.from({ length: this.value }, (_, i) => i + 1);
  }

  public isMultiple(): boolean {
    return this.value > 1;
  }

  public getDisplayName(): string {
    return `${this.value} position${this.isMultiple() ? 's' : ''}`;
  }

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

  static createAll(): PositionCount[] {
    return Array.from({ length: PositionCount.MAX_POSITIONS }, (_, i) => new PositionCount(i + 1));
  }

  static getMaxPositions(): number {
    return PositionCount.MAX_POSITIONS;
  }
}
