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

  /**
   * Get the full wallet address
   */
  public getValue(): string {
    return this.value;
  }

  /**
   * Get shortened address for display (first 4 + last 4 chars)
   */
  public getShortAddress(): string {
    if (this.value.length <= 8) {
      return this.value;
    }
    return `${this.value.slice(0, 4)}...${this.value.slice(-4)}`;
  }

  /**
   * Check if this wallet equals another
   */
  public equals(other: WalletAddress): boolean {
    return this.value === other.value;
  }

  /**
   * String representation
   */
  public toString(): string {
    return this.value;
  }

  /**
   * Check if address looks like a valid Solana address (more thorough)
   */
  public isValidSolanaAddress(): boolean {
    return this.value.length === 44;
  }

  /**
   * Get wallet address type/format info
   */
  public getAddressInfo(): {
    length: number;
    isStandardSolana: boolean;
    shortAddress: string;
  } {
    return {
      length: this.value.length,
      isStandardSolana: this.isValidSolanaAddress(),
      shortAddress: this.getShortAddress(),
    };
  }
}
