import type { PositionSizeOptions } from 'positions-size/discord/commands/position-size.command';

/**
 * Command DTO for calculating position sizes
 * Represents the input parameters for position size calculation
 */
export class CalculatePositionSizesCommand {
  constructor(
    public readonly guildId: string,
    public readonly walletOverride?: string,
    public readonly stoplossOverride?: number,
    public readonly currentSize?: number,
  ) {}

  static fromOptions(guildId: string, options: PositionSizeOptions): CalculatePositionSizesCommand {
    return new CalculatePositionSizesCommand(
      guildId,
      options.wallet?.trim() || undefined,
      options.stoploss ?? undefined,
      options.current_size ?? undefined,
    );
  }

  public hasWalletOverride(): boolean {
    return !!this.walletOverride;
  }

  public hasStoplossOverride(): boolean {
    return this.stoplossOverride !== undefined;
  }

  public hasCurrentSize(): boolean {
    return this.currentSize !== undefined;
  }
}
