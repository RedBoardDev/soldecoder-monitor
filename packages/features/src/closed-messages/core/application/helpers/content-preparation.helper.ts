import type { ChannelConfigEntity } from '@soldecoder-monitor/data';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { Message } from 'discord.js';
import { buildPositionImage } from '../../../discord/ui/image-generation';
import { buildPositionMessage, buildTriggeredMessage } from '../../../discord/ui/message-builders';
import type { PreparedContent } from '../../domain/types/prepared-content.types';
import type { TriggerData } from '../../domain/types/trigger.types';
import type { ClosedPosition } from '../../domain/value-objects/closed-position.vo';

const logger = createFeatureLogger('content-preparation-helper');

export async function prepareClosedPositionContent(
  originalMessage: Message,
  closedPosition: ClosedPosition,
  mention: string | null,
  channelConfig: ChannelConfigEntity,
  triggerData: TriggerData | null,
): Promise<PreparedContent> {
  try {
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
            attachment: await buildPositionImage(closedPosition),
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
