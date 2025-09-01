import type { PositionStatus } from '../../core/domain/value-objects/position-status.vo';

/**
 * Format a single position for display
 */
export function formatPosition(position: PositionStatus, percentOnly: boolean): string {
  const icon = getStatusIcon(position.status);
  const pnlText = formatPnL(position, percentOnly);
  const priceText = formatPriceText(position, percentOnly);
  const feesText = formatFeesText(position, percentOnly);

  return `${icon} ${position.symbolShort} ${pnlText}\n└ ${priceText} | ${feesText}`;
}

/**
 * Format wallet field with all its positions
 */
export function formatWalletField(positions: PositionStatus[], percentOnly: boolean): string {
  const sortedPositions = positions.sort((a, b) => a.symbolShort.localeCompare(b.symbolShort));

  return sortedPositions.map((pos) => formatPosition(pos, percentOnly)).join('\n');
}

function getStatusIcon(status: 'profit' | 'loss' | 'neutral'): string {
  const icons = {
    profit: '🟢',
    loss: '🔴',
    neutral: '⚪',
  };

  return icons[status] || icons.neutral;
}

function formatPnL(position: PositionStatus, percentOnly: boolean): string {
  const sign = position.pnl >= 0 ? '+' : '';

  if (percentOnly) {
    return `${sign}••• SOL (**${sign}${position.pnlPercentage.toFixed(2)}%**)`;
  }

  const pnlText = `${sign}${position.pnl.toFixed(2)} SOL`;
  const percentageText = `(**${sign}${position.pnlPercentage.toFixed(2)}%**)`;

  return `${pnlText} ${percentageText}`;
}

function formatPriceText(position: PositionStatus, percentOnly: boolean): string {
  if (percentOnly) {
    return 'From ••• → •••';
  }

  return `From ${position.startPrice.toFixed(2)} → ${position.currentPrice.toFixed(2)}`;
}

function formatFeesText(position: PositionStatus, percentOnly: boolean): string {
  const totalFees = position.getTotalFees();
  const feesPercentage = position.getFeesPercentage();

  if (percentOnly) {
    return `Fees: ••• (${feesPercentage.toFixed(2)}%)`;
  }

  return `Fees: ${totalFees.toFixed(2)} (${feesPercentage.toFixed(2)}%)`;
}
