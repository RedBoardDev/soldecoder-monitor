import type { MetlexLink } from '../types/closed-message.types';

/**
 * Value Object representing parsed closed message data
 */
export class ClosedMessageData {
  constructor(
    public readonly walletPrefix: string,
    public readonly positionHashes: readonly string[],
    public readonly positionAddresses: readonly string[],
    public readonly links: readonly MetlexLink[],
  ) {
    if (!walletPrefix.trim()) {
      throw new Error('Wallet prefix cannot be empty');
    }
    if (positionHashes.length === 0) {
      throw new Error('At least one position hash is required');
    }
    if (positionAddresses.length === 0) {
      throw new Error('At least one position address is required');
    }
    if (links.length === 0) {
      throw new Error('At least one Metlex link is required');
    }
  }

  public isValid(): boolean {
    return (
      this.walletPrefix.length > 0 &&
      this.positionHashes.length > 0 &&
      this.positionAddresses.length > 0 &&
      this.links.length > 0
    );
  }

  firstPositionHash(): string {
    return this.positionHashes[0];
  }

  firstPositionAddress(): string {
    return this.positionAddresses[0];
  }

  positionCount(): number {
    return this.positionHashes.length;
  }
}
