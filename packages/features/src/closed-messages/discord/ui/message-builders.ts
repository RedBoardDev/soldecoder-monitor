import type { FinalPositionData, TriggerData } from '../../core/domain/types/trigger.types';

/**
 * Builds a standard closed position message
 * Format: "🟢 Position closed: +X.XX% profit (+Y.YY SOL)"
 */
export function buildPositionMessage(positionData: FinalPositionData): string {
  const { pnl_percentage, net_result } = positionData.performance;

  const icon = pnl_percentage > 0 ? '🟢' : pnl_percentage < 0 ? '🔴' : '⚪';
  const pctLabel =
    pnl_percentage === 0
      ? '0.00% change'
      : `${pnl_percentage > 0 ? '+' : ''}${pnl_percentage.toFixed(2)}% ${pnl_percentage > 0 ? 'profit' : 'loss'}`;
  const solLabel = `(${net_result.sol >= 0 ? '+' : ''}${net_result.sol.toFixed(2)} SOL)`;

  return `${icon} Position closed: ${pctLabel} ${solLabel}`;
}

/**
 * Builds a triggered message for take-profit or stop-loss events
 * Format: "🎯 Take profit triggered: +15.50% profit (+2.34 SOL)"
 */
export function buildTriggeredMessage(positionData: FinalPositionData, trigger: TriggerData): string {
  const { pnl_percentage, net_result } = positionData.performance;
  const solLabel = `(${net_result.sol >= 0 ? '+' : ''}${net_result.sol.toFixed(2)} SOL)`;

  if (trigger.type === 'take_profit') {
    const icon = '🎯';
    const label = `${pnl_percentage.toFixed(2)}% profit`;
    return `${icon} Take profit triggered: +${label} ${solLabel}`;
  } else {
    const icon = '🛑';
    const label = `${Math.abs(pnl_percentage).toFixed(2)}% loss`;
    return `${icon} Stop loss triggered: -${label} ${solLabel}`;
  }
}
