import type { IWalletInfoService, WalletInfo, WalletPosition } from '../../../shared/application/interfaces/wallet-info.service.interface';

/**
 * Mock implementation of WalletInfoService for development
 * Returns simulated wallet data for testing position calculations
 */
export class WalletInfoMockService implements IWalletInfoService {
  async getSolBalance(walletAddress: string): Promise<number> {
    // Simulate realistic SOL balance based on wallet address hash
    const hash = this.simpleHash(walletAddress);
    return 50 + (hash % 200); // 50-250 SOL range
  }

  async getPositions(_walletAddress: string): Promise<WalletPosition[]> {
    // Return empty positions for now - positions value will be included in totalNetWorth
    return [];
  }

  async getTotalNetWorth(walletAddress: string): Promise<number> {
    // Simulate realistic net worth based on wallet address
    const hash = this.simpleHash(walletAddress);
    const solBalance = await this.getSolBalance(walletAddress);
    const positionsValue = (hash % 50) + 10; // 10-60 SOL in positions
    return solBalance + positionsValue;
  }

  async getWalletInfo(walletAddress: string): Promise<WalletInfo> {
    const solBalance = await this.getSolBalance(walletAddress);
    const positions = await this.getPositions(walletAddress);
    const totalNetWorth = await this.getTotalNetWorth(walletAddress);

    return {
      solBalance,
      positions,
      totalNetWorth,
      lastUpdated: Date.now(),
    };
  }

  async updateWalletInfo(_walletAddress: string): Promise<void> {
    // Mock update - no-op for now
    return Promise.resolve();
  }

  /**
   * Simple hash function to generate consistent pseudo-random values from wallet address
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}
