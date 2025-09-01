import type {
  LpAgentHistoricalResponse,
  LpAgentOverviewResponse,
  LpAgentResponse,
} from '@shared/discord/types/lpagent.types';
import type { WalletAddress } from '@shared/domain/value-objects/wallet-address.vo';

/**
 * Cache information for LpAgent data
 */
export interface LpAgentCacheInfo {
  lastUpdated: string;
  remainingSeconds: number;
}

/**
 * Service interface for retrieving LpAgent portfolio data
 * This belongs in the application layer as it defines the contract
 * that infrastructure implementations must follow
 */
export interface ILpAgentService {
  /**
   * Retrieves opening LP positions for a wallet
   * @param wallet - The wallet address value object to fetch positions for
   * @returns Promise resolving to opening positions response
   * @throws {ExternalServiceError} When external API is unavailable or returns error
   */
  getOpeningPositions(wallet: WalletAddress): Promise<LpAgentResponse>;

  /**
   * Retrieves historical LP positions for a wallet with pagination
   * @param wallet - The wallet address value object to fetch positions for
   * @param page - Page number for pagination (default: 1)
   * @param limit - Number of items per page (default: 20)
   * @returns Promise resolving to historical positions response
   * @throws {ExternalServiceError} When external API is unavailable or returns error
   */
  getHistoricalPositions(wallet: WalletAddress, page?: number, limit?: number): Promise<LpAgentHistoricalResponse>;

  /**
   * Retrieves portfolio overview/statistics for a wallet
   * @param wallet - The wallet address value object to fetch overview for
   * @returns Promise resolving to portfolio overview response
   * @throws {ExternalServiceError} When external API is unavailable or returns error
   */
  getOverview(wallet: WalletAddress): Promise<LpAgentOverviewResponse>;

  /**
   * Gets cache information for a specific wallet's opening positions
   * @param wallet - The wallet address value object
   * @returns Cache info with last updated time and remaining seconds, or null if not cached
   */
  getCacheInfo(wallet: WalletAddress): LpAgentCacheInfo | null;

  /**
   * Gets remaining cache time in seconds for a wallet's data
   * @param wallet - The wallet address value object
   * @returns Remaining cache time in seconds (0 if not cached or expired)
   */
  getCacheTimeRemaining(wallet: WalletAddress): number;

  /**
   * Clears cache for specific wallet or all wallets
   * @param wallet - Optional wallet address value object to clear specific cache
   */
  clearCache(wallet?: WalletAddress): void;
}
