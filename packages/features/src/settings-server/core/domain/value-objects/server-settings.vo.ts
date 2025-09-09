import { InvalidServerSettingsError } from '../errors/settings-server.errors';

export class PositionSizeDefaults {
  private constructor(
    public readonly walletAddress: string | null,
    public readonly stopLossPercent: number | null,
  ) {}

  static create(walletAddress: string | null, stopLossPercent: number | null): PositionSizeDefaults {
    if (stopLossPercent !== null) {
      if (!Number.isFinite(stopLossPercent) || stopLossPercent < 0 || stopLossPercent > 100) {
        throw new InvalidServerSettingsError('Stop loss percentage must be between 0 and 100');
      }
    }

    if (walletAddress !== null && walletAddress.length === 0) {
      throw new InvalidServerSettingsError('Wallet address cannot be empty');
    }

    return new PositionSizeDefaults(walletAddress, stopLossPercent);
  }

  get hasWallet(): boolean {
    return this.walletAddress !== null && this.walletAddress.length > 0;
  }

  get hasStopLoss(): boolean {
    return this.stopLossPercent !== null;
  }

  get isConfigured(): boolean {
    return this.hasWallet || this.hasStopLoss;
  }

  get displayWallet(): string {
    if (!this.hasWallet || !this.walletAddress) return 'Not set';
    return `${this.walletAddress.slice(0, 8)}...`;
  }

  get displayStopLoss(): string {
    if (!this.hasStopLoss) return 'Not set';
    return `${this.stopLossPercent}%`;
  }

  equals(other: PositionSizeDefaults): boolean {
    return this.walletAddress === other.walletAddress && this.stopLossPercent === other.stopLossPercent;
  }
}
