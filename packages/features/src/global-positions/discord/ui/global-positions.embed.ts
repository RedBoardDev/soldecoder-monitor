import { EmbedBuilder } from 'discord.js';
import type { GlobalPositionsEmbedParams } from '../../core/domain/types/global-positions.types';
import type { PositionStatus } from '../../core/domain/value-objects/position-status.vo';
import { PositionSummary } from '../../core/domain/value-objects/position-summary.vo';
import { formatWalletField } from '../helpers/position-formatter.helper';

/**
 * Builds global positions overview embed with clean, maintainable code
 */
export function buildGlobalPositionsEmbed(params: GlobalPositionsEmbedParams): EmbedBuilder {
  const { positionsByWallet, percentOnly, footerText, updateId } = params;

  const embed = createBaseEmbed(footerText, updateId);

  if (positionsByWallet.size === 0) {
    return embed.setDescription('No active positions found in followed channels.');
  }

  const summary = PositionSummary.create(positionsByWallet);
  addWalletFields(embed, positionsByWallet, percentOnly);
  embed.setDescription(summary.getSummaryText(percentOnly));

  return embed;
}

function createBaseEmbed(footerText?: string, updateId?: string): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('📊 Position overview')
    .setColor(0x5865f2)
    .setTimestamp()
    .setFooter({
      text: (footerText ?? 'Every 1 minute - ') + (updateId ? updateId : ''),
    });
}

function addWalletFields(
  embed: EmbedBuilder,
  positionsByWallet: Map<string, PositionStatus[]>,
  percentOnly: boolean,
): void {
  const sortedWallets = new Map([...positionsByWallet.entries()].sort());

  for (const [walletName, positions] of sortedWallets) {
    const walletField = formatWalletField(positions, percentOnly);

    embed.addFields({
      name: `👤 ${walletName}`,
      value: walletField,
      inline: false,
    });
  }
}
