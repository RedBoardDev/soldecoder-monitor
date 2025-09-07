import type { ButtonInteraction, ModalSubmitInteraction } from 'discord.js';
import { WalletAddress } from '../../../../shared/domain/value-objects/wallet-address.vo';
import { type SetupSession, type SetupSessionService, SetupStep } from '../../../core';
import { buildStep3Components, buildStep3Embed } from '../../ui/steps';
import { buildWalletConfigModal } from '../../ui/wallet-config.modal';

export class WalletConfigHandler {
  constructor(private readonly sessionService: SetupSessionService) {}

  async handleModalOpen(interaction: ButtonInteraction): Promise<void> {
    const modal = buildWalletConfigModal();
    await interaction.showModal(modal);
  }

  async handleButton(interaction: ButtonInteraction, session: SetupSession): Promise<void> {
    const action = interaction.customId.split(':')[2];

    if (action === 'skip') {
      this.sessionService.updateStep(session.guildId, session.userId, SetupStep.FEATURE_TOGGLES);

      const embed = buildStep3Embed(session);
      const components = buildStep3Components(session);

      await interaction.editReply({
        embeds: [embed],
        components,
      });
    }
  }

  async handleModalSubmit(interaction: ModalSubmitInteraction, session: SetupSession): Promise<void> {
    const walletAddress = interaction.fields.getTextInputValue('wallet_address');
    const stopLossInput = interaction.fields.getTextInputValue('stop_loss_percent');

    try {
      WalletAddress.create(walletAddress);
    } catch (_error) {
      await interaction.followUp({
        content: '❌ Invalid wallet address. Please provide a valid Solana address.',
        ephemeral: true,
      });
      return;
    }

    let stopLossPercent: number | undefined;
    if (stopLossInput) {
      const parsed = Number.parseFloat(stopLossInput);
      if (Number.isNaN(parsed) || parsed <= 0 || parsed > 100) {
        await interaction.followUp({
          content: '❌ Stop loss must be a number between 0 and 100.',
          ephemeral: true,
        });
        return;
      }
      stopLossPercent = parsed;
    }

    const updatedSession = this.sessionService.updateData(session.guildId, session.userId, {
      walletAddress,
      stopLossPercent,
    });
    this.sessionService.updateStep(session.guildId, session.userId, SetupStep.FEATURE_TOGGLES);

    const embed = buildStep3Embed(updatedSession);
    const components = buildStep3Components(updatedSession);

    await interaction.editReply({
      embeds: [embed],
      components,
    });
  }
}
