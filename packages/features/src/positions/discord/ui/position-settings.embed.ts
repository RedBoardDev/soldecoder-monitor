import { EmbedBuilder } from 'discord.js';

export interface PositionSettingsEmbedParams {
  shortWallet: string;
  stopLossPercent: number;
  currentSize?: number | null;
  defaultsUsageSummary: string;
}

/**
 * Builds position settings embed with consistent UX/UI design
 */
export function buildPositionSettingsEmbed(params: PositionSettingsEmbedParams): EmbedBuilder {
  const { shortWallet, stopLossPercent, currentSize, defaultsUsageSummary } = params;

  const description = [
    `📍 **Wallet:** \`${shortWallet}\``,
    `📉 **Stop Loss:** \`${stopLossPercent}%\``,
    currentSize ? `📊 **Current Size:** \`${currentSize} SOL\`` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  const embed = new EmbedBuilder()
    .setTitle('⚙️ Position Settings Retrieved')
    .setColor(0x5865f2)
    .setDescription(description)
    .addFields({
      name: 'ℹ️ Configuration Info',
      value: defaultsUsageSummary,
      inline: false,
    })
    .setFooter({
      text: '🔧 Position size calculations will be implemented next...',
    })
    .setTimestamp();

  return embed;
}
