import type { LpAgentDetailedPosition } from '@shared/discord/types/lpagent.types';
import { ClosedPosition } from '../../domain/value-objects/closed-position.vo';

function mapPositionDataToClosedPositions(position: LpAgentDetailedPosition): ClosedPosition {
  // Calculate duration in hours from createdAt to updatedAt
  const createdAt = new Date(position.createdAt);
  const updatedAt = new Date(position.updatedAt);
  const durationMs = updatedAt.getTime() - createdAt.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);

  // Extract PnL data
  const pnlPercentageSol = position.pnl.percentNative;
  const pnlPercentageUsd = position.pnl.percent;
  const pnlSol = position.pnl.valueNative;
  const pnlUsd = position.pnl.value;

  // Extract value data
  const valueSol = position.valueNative;
  const valueUsd = position.value;

  return new ClosedPosition(
    position.tokenName0,
    position.tokenName1,
    pnlPercentageSol,
    pnlPercentageUsd,
    pnlSol,
    pnlUsd,
    valueSol,
    valueUsd,
    durationHours,
  );
}

/**
 * Maps multiple detailed positions to ClosedPosition array
 * @param positions - Array of detailed position data
 * @param walletAddress - Wallet address for the positions
 * @returns Array of ClosedPosition value objects
 */
export function mapPositionsDataToClosedPositions(positions: LpAgentDetailedPosition[]): ClosedPosition[] {
  return positions.map((position) => mapPositionDataToClosedPositions(position));
}
