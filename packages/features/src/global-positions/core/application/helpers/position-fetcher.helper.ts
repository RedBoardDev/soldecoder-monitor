import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { Client, TextChannel } from 'discord.js';
import { ChannelType } from 'discord.js';
import type { PositionStatus } from '../../domain/value-objects/position-status.vo';
import { parsePositionStatusMessage } from './position-parser.helper';

const logger = createFeatureLogger('position-fetcher-helper');

const MESSAGES_TO_AVOID = ['the farmer is still running', '🚨🚨🚨 The bot process'];

/**
 * Check if a message should be avoided based on content patterns
 */
function shouldAvoidMessage(content: string): boolean {
  const lowerContent = content.toLowerCase();
  return MESSAGES_TO_AVOID.some((pattern) => lowerContent.includes(pattern.toLowerCase()));
}

/**
 * Fetch position status from a single channel
 */
async function fetchChannelPosition(
  client: Client,
  channelId: string,
): Promise<{ position: PositionStatus; channelId: string } | null> {
  try {
    const channel = client.channels.cache.get(channelId);
    if (!channel || channel.type !== ChannelType.GuildText) {
      return null;
    }

    const textChannel = channel as TextChannel;
    const messages = await textChannel.messages.fetch({ limit: 1 });
    const latestMessage = messages.first();

    if (!latestMessage || shouldAvoidMessage(latestMessage.content)) {
      return null;
    }

    const positionStatus = parsePositionStatusMessage(latestMessage.content);
    return positionStatus ? { position: positionStatus, channelId } : null;
  } catch (error) {
    logger.debug('Error fetching channel position', {
      channelId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Fetch position statuses from multiple channels
 */
export async function fetchPositionStatuses(
  client: Client,
  channelIds: string[],
): Promise<{ position: PositionStatus; channelId: string }[]> {
  const results: { position: PositionStatus; channelId: string }[] = [];

  for (const channelId of channelIds) {
    const result = await fetchChannelPosition(client, channelId);
    if (result) {
      results.push(result);
    }
  }

  return results;
}
