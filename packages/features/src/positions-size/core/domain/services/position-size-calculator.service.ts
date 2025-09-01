import type { NetWorth } from '../value-objects/net-worth.vo';
import { PositionCount } from '../value-objects/position-count.vo';
import { PositionSizeItem } from '../value-objects/position-size-item.vo';
import type { StopLossPercent } from '../value-objects/stop-loss-percent.vo';

/**
 * Calculate recommended position size using the algorithm:
 * base = (totalNetWorth - 1) / positionsCount
 * penalty = (totalNetWorth * stopLossPercent) / (100 * positionsCount^2)
 * result = max(0, base - penalty)
 */
export function computeRecommendedSize(
  netWorth: NetWorth,
  positionCount: PositionCount,
  stopLoss: StopLossPercent,
): number {
  const totalNetWorth = netWorth.getValue();
  const positions = positionCount.getValue();
  const stopLossPercent = stopLoss.getValue();

  const base = (totalNetWorth - 1) / positions;
  const penalty = (totalNetWorth * stopLossPercent) / (100 * positions * positions);
  return Math.max(0, base - penalty);
}

/**
 * Calculate position size recommendations for all position counts (1-6)
 * Includes size, stop loss amount, and delta if current size provided
 */
export function calculateAllPositionRecommendations(
  netWorth: NetWorth,
  stopLoss: StopLossPercent,
  currentSize?: number | null,
): PositionSizeItem[] {
  const positionCounts = PositionCount.createAll();
  const items: PositionSizeItem[] = [];

  for (const positionCount of positionCounts) {
    const size = computeRecommendedSize(netWorth, positionCount, stopLoss);
    const sl = stopLoss.calculateStopLossAmount(size);

    let delta: number | null = null;
    if (currentSize !== null && currentSize !== undefined && currentSize > 0) {
      delta = ((size - currentSize) / currentSize) * 100;
    }

    items.push(PositionSizeItem.create(positionCount.getValue(), size, sl, delta));
  }

  return items;
}
