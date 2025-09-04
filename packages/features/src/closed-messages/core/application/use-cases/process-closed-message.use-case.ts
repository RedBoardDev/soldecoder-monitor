import type { ILpAgentService } from '@shared/application/interfaces/lpagent.service.interface';
import { time } from '@shared/domain';
import { WalletAddress } from '@shared/domain/value-objects/wallet-address.vo';
import type { SolanaAdapter } from '@shared/infrastructure/solana.adapter';
import type { DynamoChannelConfigRepository, GuildSettingsRepository } from '@soldecoder-monitor/data';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import { ClosedMessageProcessingError } from '../../domain/errors/closed-message.errors';
import { findPositionsByHashes } from '../helpers/position-search.helper';
import { extractWalletFromPositionHash } from '../helpers/wallet-extraction.helper';
import { cumulateMultipleClosedPositions } from '../mappers/multiple-closed-positions.mapper';
import { parseClosedMessageSafe } from '../parsers/closed-message.parser';
import { ClosedMessageProcessingResult } from '../results/closed-message-processing.result';

const logger = createFeatureLogger('process-closed-message-use-case');

export class ProcessClosedMessageUseCase {
  constructor(
    private readonly channelConfigRepo: DynamoChannelConfigRepository,
    private readonly guildConfigRepo: GuildSettingsRepository,
    private readonly lpAgentService: ILpAgentService,
    private readonly solanaService: SolanaAdapter,
  ) {}

  async execute(messageId: string, channelId: string, content: string): Promise<ClosedMessageProcessingResult> {
    try {
      // Add delay to ensure lpagent historical data is available
      await new Promise((resolve) => setTimeout(resolve, time.seconds(10)));

      const validationResult = await this.validateMessageAndConfig(messageId, channelId, content);
      if (!validationResult.success) {
        return validationResult.result;
      }

      const { messageData, channelConfig } = validationResult;

      const walletAddress = await extractWalletFromPositionHash(this.solanaService, messageData, {
        messageId,
        channelId,
      });

      const wallet = WalletAddress.create(walletAddress);
      const foundPositions = await findPositionsByHashes(this.lpAgentService, wallet, messageData.positionAddresses, {
        messageId,
        walletAddress,
      });

      if (foundPositions.length === 0) {
        return ClosedMessageProcessingResult.failure(messageId, channelId, 'No matching positions found');
      }

      const cumulatedPosition = cumulateMultipleClosedPositions(foundPositions, wallet);

      if (!cumulatedPosition.meetsThreshold(channelConfig.threshold ?? 0)) {
        return ClosedMessageProcessingResult.failure(
          messageId,
          channelId,
          `PnL ${cumulatedPosition.pnlPercentageSol}% below threshold ${channelConfig.threshold ?? 0}%`,
        );
      }

      const guildConfig = await this.getGuildConfig(channelConfig.guildId);
      if (!guildConfig) {
        return ClosedMessageProcessingResult.failure(messageId, channelId, 'Guild not configured');
      }

      return ClosedMessageProcessingResult.success(messageId, channelId, cumulatedPosition, guildConfig.forwardTpSl);
    } catch (error) {
      logger.error('Failed to process closed message', error as Error, {
        messageId,
        channelId,
      });

      throw new ClosedMessageProcessingError(
        `Failed to process closed message: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? { originalError: error.message } : { error: String(error) },
      );
    }
  }

  private async validateMessageAndConfig(messageId: string, channelId: string, content: string) {
    const messageData = await parseClosedMessageSafe(content);
    if (!messageData) {
      return {
        success: false as const,
        result: ClosedMessageProcessingResult.failure(messageId, channelId, 'Invalid message format'),
      };
    }

    const channelConfig = await this.getChannelConfig(channelId);
    if (!channelConfig) {
      return {
        success: false as const,
        result: ClosedMessageProcessingResult.failure(messageId, channelId, 'Channel not configured'),
      };
    }

    if (!channelConfig.notifyOnClose) {
      return {
        success: false as const,
        result: ClosedMessageProcessingResult.failure(messageId, channelId, 'Notifications disabled'),
      };
    }

    return {
      success: true as const,
      messageData,
      channelConfig,
    };
  }

  shouldProcess(content: string): boolean {
    return content.trim().startsWith('🟨Closed');
  }

  async getChannelConfig(channelId: string) {
    return this.channelConfigRepo.getByChannelId(channelId) || null;
  }

  async getGuildConfig(guildId: string) {
    return this.guildConfigRepo.getByGuildId(guildId) || null;
  }
}
