import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

/**
 * Builds components for global positions feature
 */
export function buildGlobalPositionsComponents(): ActionRowBuilder<ButtonBuilder>[] {
  const donateRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('global-positions:donate')
      .setLabel('Support the Bot')
      .setStyle(ButtonStyle.Success)
      .setEmoji('💝'),
  );

  return [donateRow];
}
