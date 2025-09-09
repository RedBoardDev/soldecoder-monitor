import { EmbedBuilder } from 'discord.js';
import type { SummaryType } from '../../core/domain/types/summary.types';
import type { SummaryUIData } from '../../core/domain/types/summary-ui.types';

export function createSummaryEmbed(data: SummaryUIData, summaryType: SummaryType): EmbedBuilder {
  const { period, totalPnlUSD, totalPnlSOL, winRate, totalFeesSOL, nativeWinRate, totalPools, roi } = data;

  const reportType = summaryType.toUpperCase();
  const embed = new EmbedBuilder()
    .setTitle(`🔔 **SOLDECODER ${reportType} REPORT**`)
    .setColor(totalPnlUSD >= 0 ? 0x00ff00 : 0xff0000)
    .setDescription(
      [
        `📅 **Period:** ${period}`,
        '',
        '**Financial Results**',
        `• 💵 **Total P&L:** ${formatPnL(totalPnlUSD, totalPnlSOL)}`,
        `• ⏳ **Fees Earned:** ${totalFeesSOL.toFixed(2)} SOL`,
        '',
        '**Trading Stats**',
        `• 📈 **Win Rate:** ${(winRate * 100).toFixed(1)}%`,
        `• 🎯 **Trades:** ${calculateTradesSummary(winRate, totalPools)}`,
        '',
        '**Efficiency**',
        `• 🏆 **Success Rate:** ${(nativeWinRate * 100).toFixed(1)}%`,
        `• 📊 **ROI:** ${formatROI(roi)}`,
      ].join('\n'),
    )
    .setTimestamp();

  return embed;
}

function formatPnL(usd: number, sol: number): string {
  const usdSign = usd >= 0 ? '+' : '';
  const solSign = sol >= 0 ? '+' : '';
  return `${usdSign}$${usd.toFixed(2)} (${solSign}${sol.toFixed(2)} SOL)`;
}

function formatROI(roi: number): string {
  if (roi === 0) return `${roi.toFixed(1)}%`;
  const sign = roi > 0 ? '+' : '';
  return `${sign}${roi.toFixed(1)}%`;
}

function calculateTradesSummary(winRate: number, totalTrades: number): string {
  const clampedWinRate = Math.max(0, Math.min(1, winRate));
  const wins = Math.round(clampedWinRate * totalTrades);
  return `${wins}/${totalTrades} wins`;
}
