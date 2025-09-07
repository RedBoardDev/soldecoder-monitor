import type { ILpAgentService } from '@shared/application/interfaces/lpagent.service.interface';
import { time } from '@shared/domain';
import type { DynamoChannelConfigRepository, GuildSettingsRepository } from '@soldecoder-monitor/data';
import type { Message } from 'discord.js';
import { getPreviousMessage } from '../../../discord/helpers/get-previous-message.helper';
import { ClosedMessageProcessingError } from '../../domain/errors/closed-message.errors';
import { fetchPositionsByIds } from '../helpers/position-fetcher.helper';
import { parseTriggerMessage } from '../helpers/trigger-parser.helper';
import { cumulateMultipleClosedPositions } from '../mappers/multiple-closed-positions.mapper';
import { mapPositionsDataToClosedPositions } from '../mappers/position-data.mapper';
import { parseClosedMessageSafe } from '../parsers/closed-message.parser';
import { ClosedMessageProcessingResult } from '../results/closed-message-processing.result';

export class ProcessClosedMessageUseCase {
  constructor(
    private readonly channelConfigRepo: DynamoChannelConfigRepository,
    private readonly guildConfigRepo: GuildSettingsRepository,
    private readonly lpAgentService: ILpAgentService,
  ) {}

  async execute(message: Message): Promise<ClosedMessageProcessingResult> {
    try {
      await new Promise((resolve) => setTimeout(resolve, time.seconds(1)));

      const validationResult = await this.validateMessageAndConfig(message.id, message.channelId, message.content);
      if (!validationResult.success) {
        return validationResult.result;
      }

      const { messageData, channelConfig } = validationResult;

      // Get trigger information from previous message
      const previousMessage = await getPreviousMessage(message);
      const triggerData = previousMessage ? parseTriggerMessage(previousMessage.content) : null;

      const positionsData = await fetchPositionsByIds(this.lpAgentService, messageData.positionIds);

      if (positionsData.length === 0) {
        return ClosedMessageProcessingResult.failure(message.id, message.channelId, 'No matching positions found');
      }

      const closedPositions = mapPositionsDataToClosedPositions(positionsData);

      const cumulatedPosition = cumulateMultipleClosedPositions(closedPositions);

      const guildConfig = await this.getGuildConfig(channelConfig.guildId);
      if (!guildConfig) {
        return ClosedMessageProcessingResult.failure(message.id, message.channelId, 'Guild not configured');
      }

      const meetsThreshold = cumulatedPosition.meetsThreshold(channelConfig.threshold, triggerData?.type || null);

      return ClosedMessageProcessingResult.success(
        message.id,
        message.channelId,
        cumulatedPosition,
        guildConfig.forward,
        meetsThreshold,
        triggerData,
      );
    } catch (error) {
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
