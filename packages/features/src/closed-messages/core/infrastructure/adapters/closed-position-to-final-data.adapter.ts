import type { FinalPositionData } from '../../domain/types/trigger.types';
import type { ClosedPosition } from '../../domain/value-objects/closed-position.vo';

/**
 * Mapper to convert enriched ClosedPosition VO to FinalPositionData format
 * This maintains compatibility with the existing UI functions while using rich position data
 */
export function mapClosedPositionToFinalData(closedPosition: ClosedPosition): FinalPositionData {
  const netResult = closedPosition.getNetResult();
  const tvl = closedPosition.getTVL();

  return {
    metadata: {
      address: closedPosition.walletAddress.address,
      pair_name: closedPosition.pairName(),
      duration_hours: closedPosition.durationHours,
    },
    performance: {
      pnl_percentage: closedPosition.pnlPercentageSol,
      net_result: netResult,
      tvl,
    },
  };
}
