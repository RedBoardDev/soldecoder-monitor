import type { LpAgentHistoricalPosition } from '@shared/discord/types/lpagent.types';
import type { WalletAddress } from '@shared/domain';
import { ClosedPosition } from '../../domain/value-objects/closed-position.vo';

/**
 * Maps LpAgent historical position data to ClosedPosition domain VO
 * Handles all the complex data transformations and calculations from LpAgent API
 */
export function mapLpAgentToClosedPosition(
  data: LpAgentHistoricalPosition,
  walletAddress: WalletAddress,
): ClosedPosition {
  // Parse timestamps
  const createdAt = new Date(data.createdAt);
  const closedAt = new Date(data.closeAt);

  let durationHours: number;
  if (data.ageHour && !Number.isNaN(Number.parseFloat(data.ageHour))) {
    durationHours = Number.parseFloat(data.ageHour);
  } else {
    const durationMs = closedAt.getTime() - createdAt.getTime();
    durationHours = Math.max(0, durationMs / (1000 * 60 * 60));
  }

  const token0Symbol = data.tokenName0 || data.token0Info?.token_symbol || 'TOKEN0';
  const token1Symbol = data.tokenName1 || data.token1Info?.token_symbol || 'TOKEN1';

  return new ClosedPosition(
    walletAddress,
    token0Symbol,
    token1Symbol,
    data.pnl.percentNative,
    data.pnl.percent,
    data.pnl.valueNative, // PnL in native token (SOL)
    data.pnl.value, // PnL in USD
    data.valueNative, // Value in native token (SOL)
    data.value, // Value in USD
    durationHours,
    data.position,
  );
}
