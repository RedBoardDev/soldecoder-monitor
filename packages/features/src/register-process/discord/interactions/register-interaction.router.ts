import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { ButtonInteraction, ChannelSelectMenuInteraction, ModalSubmitInteraction } from 'discord.js';
import { PermissionFlagsBits } from 'discord.js';
import { SessionExpiredError, SessionNotFoundError, SessionOwnershipError, type SetupSessionService } from '../../core';
import { ChannelSelectionHandler } from './step-handlers/channel-selection.handler';
import { FeatureTogglesHandler } from './step-handlers/feature-toggles.handler';
import { FinalizeHandler } from './step-handlers/finalize.handler';
import { NavigationHandler } from './step-handlers/navigation.handler';
import { WalletConfigHandler } from './step-handlers/wallet-config.handler';

const logger = createFeatureLogger('register-process-router');

export class RegisterInteractionRouter {
  private readonly navigationHandler: NavigationHandler;
  private readonly channelSelectionHandler: ChannelSelectionHandler;
  private readonly walletConfigHandler: WalletConfigHandler;
  private readonly featureTogglesHandler: FeatureTogglesHandler;
  private readonly finalizeHandler: FinalizeHandler;

  constructor(private readonly sessionService: SetupSessionService) {
    this.navigationHandler = new NavigationHandler(sessionService);
    this.channelSelectionHandler = new ChannelSelectionHandler(sessionService);
    this.walletConfigHandler = new WalletConfigHandler(sessionService);
    this.featureTogglesHandler = new FeatureTogglesHandler(sessionService);
    this.finalizeHandler = new FinalizeHandler(sessionService);
  }

  async routeInteraction(
    interaction: ButtonInteraction | ChannelSelectMenuInteraction | ModalSubmitInteraction,
  ): Promise<void> {
    if (!interaction.guildId) {
      await interaction.reply({
        content: '❌ This can only be used in a server.',
        ephemeral: true,
      });
      return;
    }

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '❌ You need Administrator permissions to use this.',
        ephemeral: true,
      });
      return;
    }

    const customId = interaction.customId;
    const guildId = interaction.guildId;
    const userId = interaction.user.id;

    if (customId === 'register-process:step2:wallet-modal') {
      try {
        const session = this.sessionService.getSession(guildId, userId);
        this.sessionService.validateOwnership(session, userId);
        await this.walletConfigHandler.handleModalOpen(interaction as ButtonInteraction);
      } catch (error) {
        await this.handleSessionError(interaction, error);
      }
      return;
    }

    if (interaction.isButton() || interaction.isChannelSelectMenu()) {
      await interaction.deferUpdate();
    } else if (interaction.isModalSubmit()) {
      await interaction.deferUpdate();
    }

    try {
      const session = this.sessionService.getSession(guildId, userId);
      this.sessionService.validateOwnership(session, userId);

      if (this.isNavigationInteraction(customId)) {
        await this.navigationHandler.handle(interaction as ButtonInteraction, session);
      } else if (this.isStep1Interaction(customId)) {
        await this.channelSelectionHandler.handle(interaction as ChannelSelectMenuInteraction, session);
      } else if (this.isStep2Interaction(customId)) {
        if (interaction.isModalSubmit()) {
          await this.walletConfigHandler.handleModalSubmit(interaction, session);
        } else if (interaction.isButton()) {
          await this.walletConfigHandler.handleButton(interaction, session);
        }
      } else if (this.isStep3Interaction(customId)) {
        await this.featureTogglesHandler.handle(interaction as ButtonInteraction, session);
      } else if (this.isStep4Interaction(customId)) {
        await this.finalizeHandler.handle(interaction as ButtonInteraction, session);
      } else {
        logger.warn('Unknown interaction custom ID', { customId, guildId, userId });
      }
    } catch (error) {
      await this.handleSessionError(interaction, error);
    }
  }

  private isNavigationInteraction(customId: string): boolean {
    return customId.startsWith('register-process:nav:');
  }

  private isStep1Interaction(customId: string): boolean {
    return customId === 'register-process:step1:channel';
  }

  private isStep2Interaction(customId: string): boolean {
    return customId.startsWith('register-process:step2:');
  }

  private isStep3Interaction(customId: string): boolean {
    return customId.startsWith('register-process:step3:');
  }

  private isStep4Interaction(customId: string): boolean {
    return customId === 'register-process:step4:confirm';
  }

  private async handleSessionError(
    interaction: ButtonInteraction | ChannelSelectMenuInteraction | ModalSubmitInteraction,
    error: unknown,
  ): Promise<void> {
    logger.error('Session error in router', error as Error, {
      customId: interaction.customId,
      guildId: interaction.guildId,
      userId: interaction.user.id,
    });

    let message: string;

    if (error instanceof SessionNotFoundError) {
      message = '❌ No active setup session found. Please run `/start` to begin.';
    } else if (error instanceof SessionExpiredError) {
      message = '❌ Your setup session has expired. Please run `/start` to begin again.';
    } else if (error instanceof SessionOwnershipError) {
      message = '❌ You are not authorized to interact with this setup session.';
    } else {
      message = '❌ An error occurred. Please try `/start` to begin again.';
    }

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          content: message,
          embeds: [],
          components: [],
        });
      } else {
        await interaction.reply({
          content: message,
          ephemeral: true,
        });
      }
    } catch (replyError) {
      logger.error('Failed to send error reply', replyError as Error);
    }
  }
}
