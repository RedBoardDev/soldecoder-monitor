import { time } from '@shared';
import { config } from '@soldecoder-monitor/config-env';
import { logger } from '@soldecoder-monitor/logger';
import type { IHttpClient } from '../application/interfaces/http-client.interface';
import type { ILpAgentService, LpAgentCacheInfo } from '../application/interfaces/lpagent.service.interface';
import type {
  LpAgentHistoricalResponse,
  LpAgentOverviewResponse,
  LpAgentPositionResponse,
  LpAgentResponse,
} from '../discord/types/lpagent.types';
import {
  LpAgentHistoricalResponseSchema,
  LpAgentOverviewResponseSchema,
  LpAgentPositionResponseSchema,
  LpAgentResponseSchema,
} from '../discord/types/lpagent.types';
import type { WalletAddress } from '../domain/value-objects/wallet-address.vo';
import { HttpClientService } from './http-client.service';

/**
 * LpAgent API adapter - Infrastructure implementation
 */
export class LpAgentAdapter implements ILpAgentService {
  private static instance: LpAgentAdapter;
  private readonly httpClient: IHttpClient;

  private constructor() {
    this.httpClient = new HttpClientService({
      baseUrl: 'https://api.lpagent.io/open-api/v1',
      defaultTimeout: time.seconds(30),
      userAgent: 'SolDecoder-Bot/1.0 (LpAgent)',
      cacheKeyPrefix: 'lpagent',
      defaultCacheTtlMs: time.minutes(2),
      rateLimiter: {
        maxRequests: 3,
        windowMs: time.minutes(1),
      },
    });
  }

  public static getInstance(): LpAgentAdapter {
    if (!LpAgentAdapter.instance) {
      LpAgentAdapter.instance = new LpAgentAdapter();
    }
    return LpAgentAdapter.instance;
  }

  /**
   * @inheritDoc
   */
  public async getOpeningPositions(wallet: WalletAddress): Promise<LpAgentResponse> {
    try {
      const url = `/lp-positions/opening?owner=${wallet.address}`;

      const response = await this.httpClient.get(url, LpAgentResponseSchema, {
        headers: {
          'x-api-key': config.lpagent.xAuth,
        },
        cache: {
          enabled: true,
          key: `opening-positions:${wallet.address}`,
          ttlMs: time.minutes(1),
        },
      });

      return response;
    } catch (error) {
      logger.error('❌ Failed to fetch opening positions', {
        walletAddress: wallet.shortAddress,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * @inheritDoc
   */
  public async getHistoricalPositions(wallet: WalletAddress, page = 1, limit = 20): Promise<LpAgentHistoricalResponse> {
    try {
      const url = `/lp-positions/historical?owner=${wallet.address}&page=${page}&limit=${limit}`;

      const response = await this.httpClient.get(url, LpAgentHistoricalResponseSchema, {
        headers: {
          'x-api-key': config.lpagent.xAuth,
        },
        cache: {
          enabled: true,
          key: `historical-positions:${wallet.address}:${page}:${limit}`,
          ttlMs: time.minutes(2),
        },
      });

      return response;
    } catch (error) {
      logger.error('❌ Failed to fetch historical positions', {
        walletAddress: wallet.shortAddress,
        page,
        limit,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * @inheritDoc
   */
  public async getLpPosition(positionId: string): Promise<LpAgentPositionResponse> {
    try {
      const url = `/lp-positions/position?position=${positionId}`;

      const response = await this.httpClient.get(url, LpAgentPositionResponseSchema, {
        headers: {
          'x-api-key': config.lpagent.xAuth,
        },
        cache: {
          enabled: true,
          key: `position-details:${positionId}`,
          ttlMs: time.minutes(1),
        },
      });

      return response;
    } catch (error) {
      logger.error('❌ Failed to fetch position details', {
        positionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * @inheritDoc
   */
  public async getOverview(wallet: WalletAddress): Promise<LpAgentOverviewResponse> {
    try {
      const url = `/lp-positions/overview?protocol=meteora&owner=${wallet.address}`;

      const response = await this.httpClient.get(url, LpAgentOverviewResponseSchema, {
        headers: {
          'x-api-key': config.lpagent.xAuth,
        },
        cache: {
          enabled: true,
          key: `overview:${wallet.address}`,
          ttlMs: time.minutes(5),
        },
      });

      return response;
    } catch (error) {
      logger.error('❌ Failed to fetch portfolio overview', {
        walletAddress: wallet.shortAddress,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * @inheritDoc
   */
  public getCacheInfo(wallet: WalletAddress): LpAgentCacheInfo | null {
    const cacheKey = `opening-positions:${wallet.address}`;
    const cacheInfo = this.httpClient.getCacheInfo(cacheKey);

    if (!cacheInfo) return null;

    return {
      lastUpdated: cacheInfo.lastUpdated,
      remainingSeconds: cacheInfo.remainingSeconds,
    };
  }

  /**
   * @inheritDoc
   */
  public getCacheTimeRemaining(wallet: WalletAddress): number {
    const cacheInfo = this.getCacheInfo(wallet);
    return cacheInfo?.remainingSeconds || 0;
  }

  /**
   * @inheritDoc
   */
  public clearCache(wallet?: WalletAddress): void {
    if (wallet) {
      this.httpClient.clearCache(`opening-positions:${wallet.address}`);
      this.httpClient.clearCache(`overview:${wallet.address}`);
      this.httpClient.clearCache(`historical-positions:${wallet.address}:*:*`);
    } else {
      this.httpClient.clearCache();
    }
  }
}
