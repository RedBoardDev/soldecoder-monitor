import type { ChannelConfigEntity } from '@soldecoder-monitor/data';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { Message } from 'discord.js';
import { getPreviousMessage } from '../../../discord/helpers/get-previous-message.helper';
import { buildPositionImage } from '../../../discord/ui/image-generation';
import { buildPositionMessage, buildTriggeredMessage } from '../../../discord/ui/message-builders';
import type { PreparedContent } from '../../domain/types/prepared-content.types';
import type { ClosedPosition } from '../../domain/value-objects/closed-position.vo';
import { mapClosedPositionToFinalData } from '../../infrastructure/adapters/closed-position-to-final-data.adapter';
import { parseTriggerMessage } from './trigger-parser.helper';

const logger = createFeatureLogger('content-preparation-helper');

/**
 * Prepares complete content for closed position notifications
 * Handles trigger detection, message formatting, and image generation
 */
export async function prepareClosedPositionContent(
  originalMessage: Message,
  closedPosition: ClosedPosition,
  mention: string | null,
  channelConfig: ChannelConfigEntity,
): Promise<PreparedContent> {
  try {
    const previousMessage = await getPreviousMessage(originalMessage);
    const triggerData = previousMessage ? parseTriggerMessage(previousMessage.content) : null;

    const finalPositionData = mapClosedPositionToFinalData(closedPosition);

    let contentBody: string;

    if (triggerData) {
      contentBody = buildTriggeredMessage(finalPositionData, triggerData);
    } else {
      contentBody = buildPositionMessage(finalPositionData);
    }

    const content = mention ? `${contentBody} ||${mention}||` : contentBody;

    const files = channelConfig.image
      ? [
          {
            attachment: await buildPositionImage(finalPositionData, triggerData ?? undefined),
            name: `${closedPosition.walletAddress.address}.png`,
          },
        ]
      : undefined;

    return {
      contentBody,
      content,
      files,
      triggerData,
    };
  } catch (error) {
    logger.error('Failed to prepare closed position content', error as Error, {
      messageId: originalMessage.id,
      positionAddress: closedPosition.positionAddress,
    });
    throw error;
  }
}
