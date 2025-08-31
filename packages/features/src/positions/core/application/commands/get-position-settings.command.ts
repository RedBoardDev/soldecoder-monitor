import type { PositionSizeOptions } from 'positions/discord/commands/positions-size.command';

/**
 * Command DTO for getting position settings
 * Represents the input parameters for position size calculation
 */
export class GetPositionSettingsCommand {
  constructor(
    public readonly guildId: string,
    public readonly walletOverride?: string,
    public readonly stoplossOverride?: number,
    public readonly currentSize?: number,
  ) {}

  static fromOptions(guildId: string, options: PositionSizeOptions): GetPositionSettingsCommand {
    return new GetPositionSettingsCommand(
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
