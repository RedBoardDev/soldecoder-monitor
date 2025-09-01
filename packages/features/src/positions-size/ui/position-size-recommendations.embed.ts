import { EmbedBuilder } from 'discord.js';
import type { PositionSizeItem } from '../core/domain/value-objects/position-size-item.vo';

export interface PositionSizeRecommendationsEmbedParams {
  shortWallet: string;
  netWorth: number;
  stoploss: number;
  currentSize?: number | null;
  items: PositionSizeItem[];
}

export interface PositionSizeSettingsFallbackEmbedParams {
  shortWallet: string;
  stopLossPercent: number;
  currentSize?: number | null;
  defaultsUsageSummary: string;
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
      name: `${item.getPositionEmoji()} ${item.getPositionDisplayName()}`,
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

/**
 * Builds fallback embed when wallet calculations are unavailable
 */

// TODO fallback vrm utilise et logique ??
export function buildPositionSizeSettingsFallbackEmbed(params: PositionSizeSettingsFallbackEmbedParams): EmbedBuilder {
  const { shortWallet, stopLossPercent, currentSize, defaultsUsageSummary } = params;

  return new EmbedBuilder()
    .setTitle('⚠️ Position Settings Retrieved')
    .setColor(0xffa500)
    .setDescription(
      [
        `📍 **Wallet:** \`${shortWallet}\``,
        `📉 **Stop Loss:** \`${stopLossPercent}%\``,
        currentSize ? `📊 **Current Size:** \`${currentSize} SOL\`` : null,
      ]
        .filter(Boolean)
        .join(' • '),
    )
    .addFields(
      {
        name: 'ℹ️ Configuration Info',
        value: defaultsUsageSummary,
        inline: false,
      },
      {
        name: '⚠️ Position Calculations Unavailable',
        value: 'Could not fetch wallet data for position size recommendations. Settings shown instead.',
        inline: false,
      },
    )
    .setTimestamp();
}
