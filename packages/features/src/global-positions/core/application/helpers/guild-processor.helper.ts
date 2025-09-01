import type { DynamoChannelConfigRepository, GuildSettingsRepository } from '@soldecoder-monitor/data';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { Client } from 'discord.js';
import type { GlobalMessageUpdateService } from '../../infrastructure/services/global-message-update.service';
import { fetchPositionStatuses } from './position-fetcher.helper';
import { createChannelCreatedAtMap, groupPositionsByWallet } from './position-grouper.helper';

const logger = createFeatureLogger('guild-processor-helper');

/**
 * Process position updates for a single guild
 */
export async function processGuildPositions(
  client: Client,
  guildId: string,
  guildSettingsRepository: GuildSettingsRepository,
  channelConfigRepository: DynamoChannelConfigRepository,
  globalMessageService: GlobalMessageUpdateService,
): Promise<void> {
  // Validate guild is still eligible
  const guildSettings = await guildSettingsRepository.getByGuildId(guildId);
  if (!guildSettings?.positionDisplayEnabled || !guildSettings?.globalChannelId) {
    return;
  }

  // Get channels for this guild
  const channels = await channelConfigRepository.getByGuildId(guildId);
  if (channels.length === 0) {
    return;
  }

  // Fetch position statuses from all channels
  const positionStatuses = await fetchPositionStatuses(
    client,
    channels.map((c) => c.channelId),
  );

  if (positionStatuses.length === 0) {
    return;
  }

  // Group positions by wallet (using channel creation order)
  const channelCreatedAtMap = createChannelCreatedAtMap(channels);
  const positionsByWallet = groupPositionsByWallet(positionStatuses, channelCreatedAtMap);

  // Update the global message
  await globalMessageService.updateGlobalMessage(client, guildId, guildSettings.globalChannelId, positionsByWallet);

  logger.debug('Guild positions processed successfully', { guildId, positionCount: positionStatuses.length });
}

/**
 * Utility function to add delay between operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
