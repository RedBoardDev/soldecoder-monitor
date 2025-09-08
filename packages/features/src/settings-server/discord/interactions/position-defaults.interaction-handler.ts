import { BaseInteractionHandler } from '@soldecoder-monitor/features-sdk';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { ButtonInteraction, ModalSubmitInteraction } from 'discord.js';
import { DomainError } from '../../../shared/domain';
import { WalletAddress } from '../../../shared/domain/value-objects/wallet-address.vo';
import type { GetServerSettingsUseCase, UpdateServerSettingsUseCase } from '../../core/application';
import { GetServerSettingsCommand } from '../../core/application/commands/get-server-settings.command';
import { UpdateServerSettingsCommand } from '../../core/application/commands/update-server-settings.command';
import { InvalidServerSettingsError } from '../../core/domain/errors/settings-server.errors';
import { buildPositionDefaultsModal } from '../ui/position-defaults.modal';
import { buildServerSettingsEmbed } from '../ui/server-settings.embed';
import { buildServerSettingsComponents } from '../ui/server-settings-components.builder';

export class PositionDefaultsInteractionHandler extends BaseInteractionHandler {
  constructor(
    private readonly getServerSettingsUseCase: GetServerSettingsUseCase,
    private readonly updateServerSettingsUseCase: UpdateServerSettingsUseCase,
  ) {
    super(createFeatureLogger('settings-server-position-defaults'));
  }

  async handleModalOpen(interaction: ButtonInteraction): Promise<void> {
    try {
      const guild = this.validateGuildContext(interaction);

      const getCommand = new GetServerSettingsCommand(guild.id);
      const result = await this.getServerSettingsUseCase.execute(getCommand, guild);

      const modal = buildPositionDefaultsModal(result.guildSettings.positionSizeDefaults);
      await interaction.showModal(modal);
    } catch (error) {
      await this.handleInteractionError(interaction, error, 'Position defaults modal open');
    }
  }

  async handleModalSubmit(interaction: ModalSubmitInteraction): Promise<void> {
    const walletInput = interaction.fields.getTextInputValue('position_defaults_wallet')?.trim();
    const stopLossInput = interaction.fields.getTextInputValue('position_defaults_stop_loss')?.trim();

    await this.safeDefer(interaction);

    try {
      const guild = this.validateGuildContext(interaction);

      let validatedWallet: string | null = null;
      if (walletInput && walletInput.length > 0) {
        try {
          const walletAddress = WalletAddress.create(walletInput);
          validatedWallet = walletAddress.address;
        } catch (error) {
          if (error instanceof DomainError) {
            await this.safeFollowUp(interaction, error.message);
            return;
          }
          throw new InvalidServerSettingsError('Invalid wallet address format');
        }
      }

      let validatedStopLoss: number | null = null;
      if (stopLossInput && stopLossInput.length > 0) {
        const num = Number.parseFloat(stopLossInput);
        if (!Number.isFinite(num) || num < 0 || num > 100) {
          throw new InvalidServerSettingsError('Stop loss must be a number between 0 and 100');
        }
        validatedStopLoss = Math.round(num * 100) / 100;
      }

      const updateCommand = new UpdateServerSettingsCommand(guild.id, {
        positionSizeDefaults: {
          walletAddress: validatedWallet,
          stopLossPercent: validatedStopLoss,
        },
      });

      await this.updateServerSettingsUseCase.execute(updateCommand);

      await this.refreshServerSettings(interaction);
    } catch (error) {
      if (error instanceof DomainError) {
        await this.safeFollowUp(interaction, error.message);
        return;
      }
      await this.handleErrorWithReset(interaction, error, () => this.refreshServerSettings(interaction));
    }
  }

  private async refreshServerSettings(interaction: ModalSubmitInteraction): Promise<void> {
    const guild = this.validateGuildContext(interaction);
    const getCommand = new GetServerSettingsCommand(guild.id);
    const result = await this.getServerSettingsUseCase.execute(getCommand, guild);

    const embed = buildServerSettingsEmbed(result);
    const components = buildServerSettingsComponents(result.guildSettings);

    await this.safeUpdateReply(interaction, { embeds: [embed], components });
  }
}
