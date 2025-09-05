import { ClosedPosition } from '../../domain/value-objects/closed-position.vo';

/**
 * Aggregates multiple closed positions into a single cumulative position
 * Used when multiple positions are closed in the same transaction or batch
 */
export function cumulateMultipleClosedPositions(positions: ClosedPosition[]): ClosedPosition {
  if (positions.length === 0) {
    throw new Error('Cannot cumulate zero positions');
  }

  if (positions.length === 1) return positions[0];

  let totalPnlPercentageSol = 0;
  let totalPnlPercentageUsd = 0;
  let totalPnlSol = 0;
  let totalPnlUsd = 0;
  let totalValueSol = 0;
  let totalValueUsd = 0;
  let totalDuration = 0;

  for (const pos of positions) {
    totalPnlPercentageSol += pos.pnlPercentageSol;
    totalPnlPercentageUsd += pos.pnlPercentageUsd;
    totalPnlSol += pos.pnlSol;
    totalPnlUsd += pos.pnlUsd;
    totalValueSol += pos.valueSol;
    totalValueUsd += pos.valueUsd;
    totalDuration += pos.durationHours;
  }

  const avgPnlPercentageSol = totalPnlPercentageSol / positions.length;
  const avgPnlPercentageUsd = totalPnlPercentageUsd / positions.length;
  const avgDuration = totalDuration / positions.length;

  const firstPosition = positions[0];

  return new ClosedPosition(
    firstPosition.tokenName0,
    firstPosition.tokenName1,
    avgPnlPercentageSol,
    avgPnlPercentageUsd,
    totalPnlSol,
    totalPnlUsd,
    totalValueSol,
    totalValueUsd,
    avgDuration,
  );
}
