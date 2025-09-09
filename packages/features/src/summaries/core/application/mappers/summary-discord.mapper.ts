import type { SummaryData } from '../../domain/types/summary-data.types';
import type { SummaryImageData, SummaryUIData } from '../../domain/types/summary-ui.types';

function calculateROI(totalPnlNative: number, netWorth: number): number {
  const initialValue = netWorth - totalPnlNative;

  if (Math.abs(initialValue) < 0.0001) {
    if (totalPnlNative > 0) return Infinity;
    if (totalPnlNative < 0) return -Infinity;
    return 0;
  }

  const roi = (totalPnlNative / initialValue) * 100;

  return roi;
}

export function mapSummaryToDiscordUI(summaryData: SummaryData, period: string): SummaryUIData {
  return {
    period,
    totalPnlUSD: summaryData.totalPnl,
    totalPnlSOL: summaryData.totalPnlNative,
    totalFeesSOL: summaryData.totalFeeNative,
    winRate: summaryData.winRateNative,
    nativeWinRate: summaryData.winRateNative,
    totalPools: summaryData.closedLp,
    roi: calculateROI(summaryData.totalPnlNative, summaryData.netWorth),
  };
}

export function mapSummaryToImageData(summaryData: SummaryData, period: string): SummaryImageData {
  return {
    period,
    totalPnlUSD: summaryData.totalPnl,
    totalPnlSOL: summaryData.totalPnlNative,
    winRate: summaryData.winRateNative,
    roi: calculateROI(summaryData.totalPnlNative, summaryData.netWorth),
  };
}
