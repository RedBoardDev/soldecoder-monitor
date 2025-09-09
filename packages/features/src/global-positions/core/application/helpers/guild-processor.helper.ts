import type { DynamoChannelConfigRepository, GuildSettingsRepository } from '@soldecoder-monitor/data';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { Client } from 'discord.js';
import type { GlobalMessageUpdateService } from '../../infrastructure/services/global-message-update.service';
import { fetchPositionStatuses } from './position-fetcher.helper';
import { createChannelCreatedAtMap, groupPositionsByWallet } from './position-grouper.helper';

const logger = createFeatureLogger('guild-processor-helper');

/**
 * Process position updates for a single guild
 * Wrapped with comprehensive error handling to prevent crashes
 */
export async function processGuildPositions(
  client: Client,
  guildId: string,
  guildSettingsRepository: GuildSettingsRepository,
  channelConfigRepository: DynamoChannelConfigRepository,
  globalMessageService: GlobalMessageUpdateService,
): Promise<void> {
  try {
    const guildSettings = await guildSettingsRepository.getByGuildId(guildId);
    if (!guildSettings?.positionDisplayEnabled || !guildSettings?.globalChannelId) {
      return;
    }

    const channels = await channelConfigRepository.getByGuildId(guildId);
    if (channels.length === 0) {
      return;
    }

    const positionStatuses = await fetchPositionStatuses(
      client,
      channels.map((c) => c.channelId),
    );

    const channelCreatedAtMap = createChannelCreatedAtMap(channels);
    const positionsByWallet = groupPositionsByWallet(positionStatuses, channelCreatedAtMap);

    await globalMessageService.updateGlobalMessage(client, guildId, guildSettings.globalChannelId, positionsByWallet);

    // logger.debug('Guild positions processed successfully', { guildId, positionCount: positionStatuses.length });
  } catch (error) {
    logger.error('Error in processGuildPositions - this should never cause a bot crash', error as Error, {
      guildId,
      errorType: error instanceof Error ? error.constructor.name : 'unknown',
    });
  }
}

/**
 * Utility function to add delay between operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
