import type { ILpAgentService } from '@shared/application/interfaces/lpagent.service.interface';
import type { WalletAddress } from '@shared/domain';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { ClosedPosition } from '../../domain/value-objects/closed-position.vo';
import { mapLpAgentToClosedPosition } from '../mappers/lpagent-to-closed-position.mapper';

const logger = createFeatureLogger('position-search-helper');

async function findPositionByHash(
  lpAgentService: ILpAgentService,
  wallet: WalletAddress,
  positionHash: string,
): Promise<ClosedPosition | null> {
  const maxPage = 5;

  for (let page = 1; page <= maxPage; page++) {
    try {
      const historicalResponse = await lpAgentService.getHistoricalPositions(wallet, page, 20);
      const historicalData = historicalResponse.data;

      if (!historicalData.data || historicalData.data.length === 0) {
        break;
      }

      const matchingPosition = historicalData.data.find((p) => p.position === positionHash);
      if (matchingPosition) {
        return mapLpAgentToClosedPosition(matchingPosition, wallet);
      }

      if (historicalData.data.length < 20) {
        break;
      }
    } catch (error) {
      logger.error(`Failed to fetch page ${page} for position search`, error as Error, {
        positionHash,
        walletAddress: wallet.address,
        page,
      });
      break;
    }
  }

  return null;
}

/**
 * Searches multiple positions by their hashes
 */
export async function findPositionsByHashes(
  lpAgentService: ILpAgentService,
  wallet: WalletAddress,
  positionAddresses: string[],
  context: { messageId: string; walletAddress: string },
): Promise<ClosedPosition[]> {
  const foundPositions: ClosedPosition[] = [];

  for (const positionAddress of positionAddresses) {
    const position = await findPositionByHash(lpAgentService, wallet, positionAddress);
    if (position) {
      foundPositions.push(position);
    } else {
      logger.warn('Position not found in historical data', {
        messageId: context.messageId,
        positionAddress,
        walletAddress: context.walletAddress,
      });
    }
  }

  return foundPositions;
}
