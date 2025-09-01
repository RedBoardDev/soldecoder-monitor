import type { ChannelConfigEntity } from '@soldecoder-monitor/data';
import type { PositionStatus } from '../../domain/value-objects/position-status.vo';

/**
 * Create a map of channel ID to creation timestamp
 */
export function createChannelCreatedAtMap(channels: ChannelConfigEntity[]): Map<string, number> {
  return new Map(channels.map((c) => [c.channelId, c.createdAt]));
}

/**
 * Group positions by wallet name, ordered by channel creation time
 */
export function groupPositionsByWallet(
  positionData: { position: PositionStatus; channelId: string }[],
  channelCreatedAtMap: Map<string, number>,
): Map<string, PositionStatus[]> {
  // Sort by channel creation time (oldest first)
  const sortedPositionData = positionData.sort((a, b) => {
    const createdAtA = channelCreatedAtMap.get(a.channelId) || Date.now();
    const createdAtB = channelCreatedAtMap.get(b.channelId) || Date.now();
    return createdAtA - createdAtB;
  });

  // Group by wallet name
  const positionsByWallet = new Map<string, PositionStatus[]>();
  for (const { position } of sortedPositionData) {
    const walletKey = position.walletName;
    if (!positionsByWallet.has(walletKey)) {
      positionsByWallet.set(walletKey, []);
    }
    const positions = positionsByWallet.get(walletKey);
    if (positions) {
      positions.push(position);
    }
  }

  return positionsByWallet;
}
