import { InvalidWalletAddressError } from '../errors/wallet-address.errors';

/**
 * Wallet Address Value Object
 * Encapsulates wallet address validation and formatting logic
 */
export class WalletAddress {
  private constructor(private readonly value: string) {}

  /**
   * Create a validated wallet address
   * @param address Raw wallet address string
   * @throws InvalidWalletAddressError if address is invalid
   */
  static create(address: string): WalletAddress {
    const cleaned = address.trim();

    if (!cleaned) {
      throw new InvalidWalletAddressError(address);
    }

    // Basic Solana address validation (44 characters, Base58)
    if (cleaned.length < 32 || cleaned.length > 44) {
      throw new InvalidWalletAddressError(address);
    }

    // Basic Base58 character check (simplified)
    const base58Regex = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
    if (!base58Regex.test(cleaned)) {
      throw new InvalidWalletAddressError(address);
    }

    return new WalletAddress(cleaned);
  }

  get address(): string {
    return this.value;
  }

  get shortAddress(): string {
    if (this.value.length <= 8) {
      return this.value;
    }
    return `${this.value.slice(0, 4)}...${this.value.slice(-4)}`;
  }

  equals(other: WalletAddress): boolean {
    return this.value === other.value;
  }

  get isValidSolanaAddress(): boolean {
    return this.value.length === 44;
  }
}
