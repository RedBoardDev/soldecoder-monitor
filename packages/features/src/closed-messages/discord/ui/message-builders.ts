import type { ClosedPosition } from 'closed-messages/core';
import type { TriggerData } from '../../core/domain/types/trigger.types';

/**
 * Builds a standard closed position message
 * Format: "🟢 Position closed: +X.XX% profit (+Y.YY SOL)"
 */
export function buildPositionMessage(closedPosition: ClosedPosition): string {
  const { pnlPercentageSol: pnlPercentage, netResult } = closedPosition;

  const icon = pnlPercentage > 0 ? '🟢' : pnlPercentage < 0 ? '🔴' : '⚪';
  const pctLabel =
    pnlPercentage === 0
      ? '0.00% change'
      : `${pnlPercentage > 0 ? '+' : ''}${pnlPercentage.toFixed(2)}% ${pnlPercentage > 0 ? 'profit' : 'loss'}`;
  const solLabel = `(${netResult.sol >= 0 ? '+' : ''}${netResult.sol.toFixed(2)} SOL)`;

  return `${icon} Position closed: ${pctLabel} ${solLabel}`;
}

/**
 * Builds a triggered message for take-profit or stop-loss events
 * Format: "🎯 Take profit triggered: +15.50% profit (+2.34 SOL)"
 */
export function buildTriggeredMessage(closedPosition: ClosedPosition, trigger: TriggerData): string {
  const { pnlPercentageSol: pnlPercentage, netResult } = closedPosition;

  const solLabel = `(${netResult.sol >= 0 ? '+' : ''}${netResult.sol.toFixed(2)} SOL)`;

  if (trigger.type === 'take_profit') {
    const icon = '🎯';
    const label = `${pnlPercentage.toFixed(2)}% profit`;
    return `${icon} Take profit triggered: +${label} ${solLabel}`;
  } else {
    const icon = '🛑';
    const label = `${Math.abs(pnlPercentage).toFixed(2)}% loss`;
    return `${icon} Stop loss triggered: -${label} ${solLabel}`;
  }
}
