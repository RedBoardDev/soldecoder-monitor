import type { LpAgentDetailedPosition } from '@shared/discord/types/lpagent.types';
import { ClosedPosition } from '../../domain/value-objects/closed-position.vo';

function mapPositionDataToClosedPositions(position: LpAgentDetailedPosition): ClosedPosition {
  const createdAt = new Date(position.createdAt);
  const updatedAt = new Date(position.updatedAt);
  const durationMs = updatedAt.getTime() - createdAt.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);

  const pnlPercentageSol = position.pnl.percentNative;
  const pnlPercentageUsd = position.pnl.percent;
  const pnlSol = position.pnl.valueNative;
  const pnlUsd = position.pnl.value;

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

export function mapPositionsDataToClosedPositions(positions: LpAgentDetailedPosition[]): ClosedPosition[] {
  return positions.map((position) => mapPositionDataToClosedPositions(position));
}
