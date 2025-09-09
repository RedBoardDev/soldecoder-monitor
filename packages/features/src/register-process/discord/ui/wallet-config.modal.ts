import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

export function buildWalletConfigModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId('register-process:step2:wallet-submit')
    .setTitle('Wallet & Stop Loss Configuration')
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('wallet_address')
          .setLabel('Main Wallet Address')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Ex: 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')
          .setRequired(true)
          .setMaxLength(44)
          .setMinLength(32),
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId('stop_loss_percent')
          .setLabel('Default Stop Loss (%) - Optional')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('Ex: 10 (for -10%)')
          .setRequired(false)
          .setMaxLength(5),
      ),
    );
}
