import { createFeatureLogger } from '@soldecoder-monitor/logger';
import { PositionStatus } from '../../domain/value-objects/position-status.vo';

const logger = createFeatureLogger('position-parser-helper');

/**
 * Parse a Discord position status message into a PositionStatus object.
 * @param content Raw message string
 * @returns Parsed PositionStatus or null if invalid
 */
export function parsePositionStatusMessage(content: string): PositionStatus | null {
  try {
    const firstLine = content.split('\n')[0].trim();
    const cleanContent = firstLine
      .replace(/^:[^:]*:\s*/, '')
      .replace(/^[\u{1F300}-\u{1F9FF}]\s*/u, '')
      .trim();

    const basePattern =
      /^(.+?)\s*\(Symbol:\s*(.+?)\)\s*\|\s*PnL:\s*([-+]?\d+\.?\d*)\s*SOL\s*\(Return:\s*([-+]?\d+\.?\d*)%\)\s*\|\s*Start:\s*(\d+\.?\d*)\s*SOL\s*→\s*Current:\s*(\d+\.?\d*)\s*SOL\s*\|\s*Unclaimed Fees:\s*(\d+\.?\d*)\s*SOL/;

    const baseMatch = cleanContent.match(basePattern);
    if (!baseMatch) {
      logger.debug('Position status message does not match base format', { content: cleanContent });
      return null;
    }

    const [, , symbolShort, pnlStr, pnlPercentageStr, startPriceStr, currentPriceStr, unclaimedFeesStr] = baseMatch;

    const matchIndex = baseMatch.index ?? 0;
    const remainingContent = cleanContent.substring(matchIndex + baseMatch[0].length);

    const walletPattern = /.*?\|\s*Wallet:\s*(.+?)\s*\((.+?)\)$/;
    const claimedFeesPattern = /\|\s*Claimed Fees:\s*(\d+\.?\d*)\s*SOL/;

    const walletMatch = remainingContent.match(walletPattern);
    if (!walletMatch) {
      logger.debug('Could not extract wallet information', { remainingContent });
      return null;
    }

    const walletName = walletMatch[1].trim();

    const claimedFeesMatch = remainingContent.match(claimedFeesPattern);
    const claimedFees = claimedFeesMatch ? Number.parseFloat(claimedFeesMatch[1]) : 0;

    const pnl = Number.parseFloat(pnlStr);
    const pnlPercentage = Number.parseFloat(pnlPercentageStr);
    const startPrice = Number.parseFloat(startPriceStr);
    const currentPrice = Number.parseFloat(currentPriceStr);
    const unclaimedFees = Number.parseFloat(unclaimedFeesStr);

    let status: 'profit' | 'loss' | 'neutral';
    if (pnlPercentage > 0) {
      status = 'profit';
    } else if (pnlPercentage < 0) {
      status = 'loss';
    } else {
      status = 'neutral';
    }

    // Create PositionStatus using our VO
    return PositionStatus.create({
      walletName,
      symbolShort: symbolShort.trim(),
      status,
      pnl,
      pnlPercentage,
      startPrice,
      currentPrice,
      unclaimedFees,
      claimedFees,
    });
  } catch (error) {
    logger.warn('Failed to parse position status message', {
      error: error instanceof Error ? error.message : String(error),
      content: content.substring(0, 150),
    });
    return null;
  }
}
