import type { PositionSizeDefaults } from '@soldecoder-monitor/data';
import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

export function buildPositionDefaultsModal(currentDefaults: PositionSizeDefaults): ModalBuilder {
  const modal = new ModalBuilder()
    .setCustomId('settings-server:position-defaults:submit')
    .setTitle('Edit Position Size Defaults');

  const walletInput = new TextInputBuilder()
    .setCustomId('position_defaults_wallet')
    .setLabel('Default Wallet Address')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Enter Solana wallet address...')
    .setRequired(false);

  if (currentDefaults.walletAddress) {
    walletInput.setValue(currentDefaults.walletAddress);
  }

  const stopLossInput = new TextInputBuilder()
    .setCustomId('position_defaults_stop_loss')
    .setLabel('Default Stop Loss (%)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Enter percentage (0-100)...')
    .setRequired(false);

  if (currentDefaults.stopLossPercent !== null) {
    stopLossInput.setValue(currentDefaults.stopLossPercent.toString());
  }

  const walletRow = new ActionRowBuilder<TextInputBuilder>().addComponents(walletInput);
  const stopLossRow = new ActionRowBuilder<TextInputBuilder>().addComponents(stopLossInput);

  modal.addComponents(walletRow, stopLossRow);

  return modal;
}
