import type { NftCollection } from '../../domain/nft.types';

/**
 * Cache information for NFT data
 */
export interface NftCacheInfo {
  lastUpdated: string;
  remainingSeconds: number;
}

/**
 * Service interface for retrieving NFT collection data
 * This belongs in the application layer as it defines the contract
 * that infrastructure implementations must follow
 */
export interface INftDataService {
  /**
   * Retrieves NFT collection data by collection ID
   * @param collectionId - The collection identifier
   * @returns Promise resolving to NFT collection data or null if not found
   * @throws {ExternalServiceError} When external API is unavailable or returns error
   */
  getNftData(collectionId: string): Promise<NftCollection | null>;

  /**
   * Gets cache information for a specific collection
   * @param collectionId - The collection identifier
   * @returns Cache info with last updated time and remaining seconds, or null if not cached
   */
  getCacheInfo(collectionId: string): NftCacheInfo | null;

  /**
   * Gets remaining cache time in seconds for a collection
   * @param collectionId - The collection identifier
   * @returns Remaining cache time in seconds (0 if not cached or expired)
   */
  getCacheTimeRemaining(collectionId: string): number;

  /**
   * Clears cache for specific collection or all collections
   * @param collectionId - Optional collection ID to clear specific cache
   */
  clearCache(collectionId?: string): void;

  /**
   * Checks if service is healthy and can make requests
   * @returns Promise resolving to true if service is healthy
   */
  isHealthy(): Promise<boolean>;
}
