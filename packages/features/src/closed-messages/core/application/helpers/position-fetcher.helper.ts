import type { ILpAgentService } from '@shared/application/interfaces/lpagent.service.interface';
import type { LpAgentDetailedPosition } from '@shared/discord/types/lpagent.types';
import { time } from '@shared/domain';

async function fetchSinglePosition(
  lpAgentService: ILpAgentService,
  positionId: string,
): Promise<LpAgentDetailedPosition | null> {
  try {
    const response = await lpAgentService.getLpPosition(positionId);

    if (response.status === 'success' && response.data) {
      return response.data;
    }

    throw new Error('Failed to fetch position');
  } catch {
    await new Promise((resolve) => setTimeout(resolve, time.seconds(5)));
    try {
      const retryResponse = await lpAgentService.getLpPosition(positionId);
      return retryResponse.status === 'success' && retryResponse.data ? retryResponse.data : null;
    } catch {
      return null;
    }
  }
}

/**
 * Fetches detailed position data for multiple position IDs with retry logic
 * @param lpAgentService - LpAgent service instance
 * @param positionIds - Array of position IDs to fetch
 * @returns Array of detailed position data
 */
export async function fetchPositionsByIds(
  lpAgentService: ILpAgentService,
  positionIds: string[],
): Promise<LpAgentDetailedPosition[]> {
  const fetchPromises = positionIds.map((positionId) => fetchSinglePosition(lpAgentService, positionId));

  const results = await Promise.allSettled(fetchPromises);

  return results
    .map((result, _index) => {
      if (result.status === 'fulfilled' && result.value) {
        return result.value;
      }
      return null;
    })
    .filter((position): position is LpAgentDetailedPosition => position !== null);
}
