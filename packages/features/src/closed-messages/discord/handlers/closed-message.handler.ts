import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { Message } from 'discord.js';
import { DomainError } from '../../../shared/domain';
import type { ProcessClosedMessageUseCase } from '../../core/application/use-cases/process-closed-message.use-case';
import type { SendClosedNotificationUseCase } from '../../core/application/use-cases/send-closed-notification.use-case';
import { InvalidChannelConfigError } from '../../core/domain/errors/closed-message.errors';
import { validateMessageForProcessing } from '../../core/infrastructure/helpers/message-validator.helper';

const logger = createFeatureLogger('closed-message-handler');

export class ClosedMessageHandler {
  constructor(
    private readonly processClosedMessageUseCase: ProcessClosedMessageUseCase,
    private readonly sendNotificationUseCase: SendClosedNotificationUseCase,
  ) {}

  async execute(message: Message): Promise<void> {
    try {
      if (!validateMessageForProcessing(message)) return;

      const result = await this.processClosedMessageUseCase.execute(message);

      if (result.isFailure || !result.closedPosition) return;

      const channelConfig = await this.processClosedMessageUseCase.getChannelConfig(message.channelId);

      if (!channelConfig) throw new InvalidChannelConfigError('Channel not configured');

      await this.sendNotificationUseCase.execute(
        message,
        result.closedPosition,
        result.shouldSendToGlobal,
        channelConfig,
        result.meetsThreshold,
        result.triggerData,
      );
    } catch (error) {
      await this.handleError(message, error);
    }
  }

  private async handleError(message: Message, error: unknown): Promise<void> {
    logger.error('Failed to handle closed message', error as Error, {
      messageId: message.id,
      channelId: message.channelId,
      guildId: message.guildId,
    });

    if (message.channel?.isSendable()) {
      let errorMessage = '❌ **Error**: Failed to process closed position message.';

      if (error instanceof DomainError) {
        errorMessage = `❌ **${error.category}**: ${error.message}`;
        logger.debug('Domain error handled', error.toLogContext());
      } else if (error instanceof Error) {
        if (error.message.includes('Missing permission')) {
          errorMessage = '❌ **Permission Error**: Missing permissions to process closed position.';
        } else if (error.message.includes('Transaction') && error.message.includes('not found')) {
          errorMessage = '❌ **Transaction Error**: Position transaction not yet finalized on Solana.';
        } else if (error.message.includes('RPC error')) {
          errorMessage = '❌ **Network Error**: Unable to fetch position data from Solana.';
        } else if (error.message.includes('LpAgent')) {
          errorMessage = '❌ **API Error**: Unable to fetch position data from LpAgent API.';
        } else if (error.message.includes('Invalid channel configuration')) {
          errorMessage = '❌ **Invalid Channel Configuration**: Channel not configured.';
        }
      }

      try {
        await message.channel.send(errorMessage);
      } catch (sendError) {
        logger.error('Failed to send error message to channel', sendError as Error);
      }
    }
  }
}
