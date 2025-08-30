import { time } from '@shared';
import { z } from 'zod';
import type { IHttpClient } from '../application/interfaces/http-client.interface';
import type { INftDataService, NftCacheInfo } from '../application/interfaces/nft-data.service.interface';
import type { NftCollection } from '../domain/nft.types';
import { NftCollectionSchema } from '../domain/nft.types';
import { HttpClientService } from './http-client.service';

/**
 * CoinGecko ping response schema
 */
const _CoinGeckoPingSchema = z.object({
  gecko_says: z.string(),
});

/**
 * CoinGecko API adapter - Infrastructure implementation
 */
export class CoinGeckoAdapter implements INftDataService {
  private static instance: CoinGeckoAdapter;
  private readonly httpClient: IHttpClient;

  private constructor() {
    this.httpClient = new HttpClientService({
      baseUrl: 'https://api.coingecko.com/api/v3',
      defaultTimeout: time.seconds(30),
      userAgent: 'SolDecoder-Bot/1.0 (CoinGecko)',
      cacheKeyPrefix: 'coingecko',
      defaultCacheTtlMs: time.minutes(5),
    }); 
  }

  /**
   * Gets singleton instance of CoinGecko adapter
   */
  public static getInstance(): CoinGeckoAdapter {
    if (!CoinGeckoAdapter.instance) {
      CoinGeckoAdapter.instance = new CoinGeckoAdapter();
    }
    return CoinGeckoAdapter.instance;
  }

  /**
   * {@inheritDoc}
   */
  public async getNftData(collectionId: string): Promise<NftCollection | null> {
    this.validateCollectionId(collectionId);

    try {
      const url = `/nfts/${collectionId}`;

      const nftData = await this.httpClient.get(url, NftCollectionSchema, {
        cache: {
          enabled: true,
          key: `nft-data:${collectionId}`,
        },
      });

      return nftData;
    } catch (error) {
      console.error(`Failed to fetch NFT data for collection ${collectionId}:`, error);
      return null;
    }
  }

  /**
   * {@inheritDoc}
   */
  public getCacheInfo(collectionId: string): NftCacheInfo | null {
    const cacheKey = `nft-data:${collectionId}`;
    const cacheInfo = this.httpClient.getCacheInfo(cacheKey);

    if (!cacheInfo) return null;

    return {
      lastUpdated: cacheInfo.lastUpdated,
      remainingSeconds: cacheInfo.remainingSeconds,
    };
  }

  /**
   * {@inheritDoc}
   */
  public getCacheTimeRemaining(collectionId: string): number {
    const cacheInfo = this.getCacheInfo(collectionId);
    return cacheInfo?.remainingSeconds || 0;
  }

  /**
   * {@inheritDoc}
   */
  public clearCache(collectionId?: string): void {
    if (collectionId) {
      const cacheKey = `nft-data:${collectionId}`;
      this.httpClient.clearCache(cacheKey);
    } else {
      this.httpClient.clearCache();
    }
  }

  /**
   * Validates collection ID format
   */
  private validateCollectionId(collectionId: string): void {
    if (!collectionId || typeof collectionId !== 'string' || collectionId.trim().length === 0) {
      throw new Error('Invalid collection ID provided');
    }
  }
}
