import { type PositionStatusData, PositionStatusSchema } from '../types/global-positions.types';

/**
 * Position Status Value Object
 * Represents the status of a single position from a channel message
 */
export class PositionStatus {
  private constructor(
    public readonly walletName: string,
    public readonly symbolShort: string,
    public readonly status: 'profit' | 'loss' | 'neutral',
    public readonly pnl: number,
    public readonly pnlPercentage: number,
    public readonly startPrice: number,
    public readonly currentPrice: number,
    public readonly unclaimedFees: number,
    public readonly claimedFees: number,
  ) {}

  static create(data: PositionStatusData): PositionStatus {
    const validated = PositionStatusSchema.parse(data);

    return new PositionStatus(
      validated.walletName,
      validated.symbolShort,
      validated.status,
      validated.pnl,
      validated.pnlPercentage,
      validated.startPrice,
      validated.currentPrice,
      validated.unclaimedFees,
      validated.claimedFees,
    );
  }

  public getTotalFees(): number {
    return this.unclaimedFees + this.claimedFees;
  }

  public getFeesPercentage(): number {
    if (this.startPrice <= 0) return 0;
    return (this.getTotalFees() / this.startPrice) * 100;
  }

  public isInProfit(): boolean {
    return this.status === 'profit';
  }

  public isInLoss(): boolean {
    return this.status === 'loss';
  }

  public isNeutral(): boolean {
    return this.status === 'neutral';
  }
}
