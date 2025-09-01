import { time } from '@shared';
import { config } from '@soldecoder-monitor/config-env';
import { ExternalServiceError } from '@soldecoder-monitor/discord/src/domain/errors/command.errors';
import { logger } from '@soldecoder-monitor/logger';
import { type WalletPosition, WalletPositionSchema } from 'shared/discord/types/lpagent.types';
import z from 'zod';
import type { IHttpClient } from '../application/interfaces/http-client.interface';
import type { IPortfolioService } from '../application/interfaces/portfolio.service.interface';
import type { WalletAddress } from '../domain/value-objects/wallet-address.vo';
import { HttpClientService } from './http-client.service';
import { LpAgentAdapter } from './lpagent.adapter';
import { LpAgentMapper } from './mappers';

const SolBalanceResponseSchema = z.object({
  jsonrpc: z.string(),
  id: z.number(),
  result: z
    .object({
      context: z.object({
        slot: z.number(),
      }),
      value: z.number(), // Balance in lamports
    })
    .optional(),
  error: z
    .object({
      code: z.number(),
      message: z.string(),
    })
    .optional(),
});

export const RENT_FEE_PER_POSITION = 0.1;

/**
 * Portfolio Service - Infrastructure implementation
 */
export class PortfolioService implements IPortfolioService {
  private static instance: PortfolioService;
  private readonly httpClient: IHttpClient;
  private readonly lpAgentAdapter: LpAgentAdapter;

  private constructor() {
    this.httpClient = new HttpClientService({
      baseUrl: config.solana.rpcEndpoint,
      defaultTimeout: time.seconds(10),
      userAgent: 'SolDecoder-Bot/1.0 (Portfolio)',
      cacheKeyPrefix: 'portfolio',
    });
    this.lpAgentAdapter = LpAgentAdapter.getInstance();
  }

  public static getInstance(): PortfolioService {
    if (!PortfolioService.instance) {
      PortfolioService.instance = new PortfolioService();
    }
    return PortfolioService.instance;
  }

  public async getTotalNetWorth(wallet: WalletAddress): Promise<number> {
    try {
      const [solBalance, positions] = await Promise.all([this.getSolBalance(wallet), this.getPositions(wallet)]);

      const positionsValue = positions.reduce((total, position) => {
        return total + position.valueNative + position.pnl.valueNative;
      }, 0);

      const rentFees = positions.length * RENT_FEE_PER_POSITION;
      const totalNetWorth = solBalance + positionsValue - rentFees;

      return Math.max(0, totalNetWorth);
    } catch (error) {
      logger.error('❌ Failed to calculate total net worth', {
        walletAddress: wallet.address,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  public async getPositions(wallet: WalletAddress): Promise<WalletPosition[]> {
    try {
      const lpAgentResponse = await this.lpAgentAdapter.getOpeningPositions(wallet);
      const positions = LpAgentMapper.toWalletPositions(lpAgentResponse);

      const validatedPositions = positions.map((pos) => WalletPositionSchema.parse(pos));
      return validatedPositions;
    } catch (error) {
      logger.error('❌ Failed to fetch positions', {
        walletAddress: wallet.shortAddress,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  public async getSolBalance(wallet: WalletAddress): Promise<number> {
    try {
      const validatedData = await this.httpClient.post(
        '',
        {
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'getBalance',
          params: [wallet.address],
        },
        SolBalanceResponseSchema,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: time.seconds(30),
          cache: {
            enabled: true,
            key: `sol-balance:${wallet.address}`,
            ttlMs: time.minutes(2),
          },
        },
      );

      if (validatedData.error || !validatedData.result) {
        throw new ExternalServiceError('Solana RPC', validatedData.error?.message);
      }

      const solBalance = validatedData.result.value / 1e9;

      return Math.max(0, solBalance);
    } catch (error) {
      logger.error('❌ Failed to fetch SOL balance', {
        walletAddress: wallet.shortAddress,
        error: error instanceof ExternalServiceError ? error.message : String(error),
      });
      return 0;
    }
  }
}
