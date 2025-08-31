import { PositionSizeItem } from '../value-objects/position-size-item.vo';

/**
 * Calculate recommended position size using the algorithm:
 * base = (totalNetWorth - 1) / positionsCount
 * penalty = (totalNetWorth * stopLossPercent) / (100 * positionsCount^2)
 * result = max(0, base - penalty)
 */
export function computeRecommendedSize(totalNetWorth: number, positionsCount: number, stopLossPercent: number): number {
  const base = (totalNetWorth - 1) / positionsCount;
  const penalty = (totalNetWorth * stopLossPercent) / (100 * positionsCount * positionsCount);
  return Math.max(0, base - penalty);
}

/**
 * Calculate position size items for 1 to maxPositions
 * Includes size, stop loss amount, and delta if current size provided
 */
export function calculatePositionItems(
  totalNetWorth: number,
  stopLossPercent: number,
  currentSize?: number | null,
  maxPositions: number = 6,
): PositionSizeItem[] {
  const items: PositionSizeItem[] = [];

  for (let positions = 1; positions <= maxPositions; positions++) {
    const size = computeRecommendedSize(totalNetWorth, positions, stopLossPercent);
    const sl = (size * stopLossPercent) / 100;

    let delta: number | null = null;
    if (currentSize !== null && currentSize !== undefined && currentSize > 0) {
      delta = ((size - currentSize) / currentSize) * 100;
    }

    items.push(PositionSizeItem.create(positions, size, sl, delta));
  }

  return items;
}
