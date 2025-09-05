import type { ChannelConfigEntity } from '@soldecoder-monitor/data';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { Message } from 'discord.js';
import { getPreviousMessage } from '../../../discord/helpers/get-previous-message.helper';
import { buildPositionImage } from '../../../discord/ui/image-generation';
import { buildPositionMessage, buildTriggeredMessage } from '../../../discord/ui/message-builders';
import type { PreparedContent } from '../../domain/types/prepared-content.types';
import type { ClosedPosition } from '../../domain/value-objects/closed-position.vo';
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

    let contentBody: string;

    if (triggerData) {
      contentBody = buildTriggeredMessage(closedPosition, triggerData);
    } else {
      contentBody = buildPositionMessage(closedPosition);
    }

    const content = mention ? `${contentBody} ||${mention}||` : contentBody;

    const files = channelConfig.image
      ? [
          {
            attachment: await buildPositionImage(closedPosition, triggerData ?? undefined),
            name: `${closedPosition.pairName}.png`,
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
      positionAddress: closedPosition.pairName,
    });
    throw error;
  }
}
