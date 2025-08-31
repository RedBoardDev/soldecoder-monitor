import { EmbedBuilder } from 'discord.js';
import type { PositionSizeItem } from '../../core/domain/value-objects/position-size-item.vo';

/**
 * Generate number emoji for position count (1-6)
 */
function numEmoji(n: number): string {
  const map: Record<number, string> = {
    1: '1️⃣',
    2: '2️⃣',
    3: '3️⃣',
    4: '4️⃣',
    5: '5️⃣',
    6: '6️⃣',
  };
  return map[n] || `${n}`;
}

export interface PositionSizeRecommendationsEmbedParams {
  shortWallet: string;
  netWorth: number;
  stoploss: number;
  currentSize?: number | null;
  items: PositionSizeItem[];
}

/**
 * Builds position size recommendations embed with exact UI/UX from original implementation
 */
export function buildPositionSizeRecommendationsEmbed(params: PositionSizeRecommendationsEmbedParams): EmbedBuilder {
  const { shortWallet, netWorth, stoploss, currentSize, items } = params;

  const fields = items.map((item) => {
    const parts: string[] = [`Size: **${item.getFormattedSize()}**`, `SL: ${item.getFormattedStopLoss()}`];

    if (item.hasDelta()) {
      parts.push(`${item.getTrendIcon()} ${item.getFormattedDelta()}`);
    }

    return {
      name: `${numEmoji(item.positions)} ${item.positions} position${item.positions > 1 ? 's' : ''}`,
      value: parts.join(' • '),
      inline: false,
    } as const;
  });

  const embed = new EmbedBuilder()
    .setTitle('📐 Position Size Recommendations')
    .setColor(0x5865f2)
    .setDescription(
      [
        `Wallet: ${shortWallet} • Net worth: ${netWorth.toFixed(2)} SOL`,
        `Stop Loss: ${stoploss}%${currentSize ? ` • Current size: ${currentSize.toFixed(2)} SOL` : ''}`,
      ].join('\n'),
    )
    .addFields(fields)
    .setTimestamp();

  return embed;
}
