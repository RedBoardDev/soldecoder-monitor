import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { ButtonInteraction, EmbedBuilder } from 'discord.js';
import { InvalidStepNavigationError, type SetupSession, type SetupSessionService, SetupStep } from '../../../core';
import {
  buildStep1Components,
  buildStep1Embed,
  buildStep2Components,
  buildStep2Embed,
  buildStep3Components,
  buildStep3Embed,
  buildStep4Components,
  buildStep4Embed,
} from '../../ui/steps';

const logger = createFeatureLogger('register-process-navigation');

export class NavigationHandler {
  constructor(private readonly sessionService: SetupSessionService) {}

  async handle(interaction: ButtonInteraction, session: SetupSession): Promise<void> {
    const action = interaction.customId.split(':')[2];

    switch (action) {
      case 'cancel':
        await this.handleCancel(interaction, session);
        break;
      case 'back':
        await this.handleBack(interaction, session);
        break;
      default:
        logger.warn('Unknown navigation action', { action });
    }
  }

  private async handleCancel(interaction: ButtonInteraction, session: SetupSession): Promise<void> {
    this.sessionService.deleteSession(session.guildId, session.userId);

    await interaction.editReply({
      content: '❌ Setup cancelled. You can restart anytime with `/start`.',
      embeds: [],
      components: [],
    });

    logger.info('Setup session cancelled', {
      guildId: session.guildId,
      userId: session.userId,
    });
  }

  private async handleBack(interaction: ButtonInteraction, session: SetupSession): Promise<void> {
    let targetStep: SetupStep;
    switch (session.currentStep) {
      case SetupStep.WALLET_CONFIG:
        targetStep = SetupStep.CHANNEL_SELECT;
        break;
      case SetupStep.FEATURE_TOGGLES:
        targetStep = SetupStep.WALLET_CONFIG;
        break;
      case SetupStep.SUMMARY_CONFIRM:
        targetStep = SetupStep.FEATURE_TOGGLES;
        break;
      default:
        throw new InvalidStepNavigationError(session.currentStep, session.currentStep - 1);
    }

    if (!this.sessionService.canNavigateToStep(session, targetStep)) {
      throw new InvalidStepNavigationError(session.currentStep, targetStep);
    }

    const updatedSession = this.sessionService.updateStep(session.guildId, session.userId, targetStep);
    await this.displayStep(interaction, updatedSession);
  }

  private async displayStep(interaction: ButtonInteraction, session: SetupSession): Promise<void> {
    const { embed, components } = this.buildStepUI(session);

    await interaction.editReply({
      embeds: [embed],
      components,
    });
  }

  private buildStepUI(session: SetupSession): { embed: EmbedBuilder; components: any[] } {
    switch (session.currentStep) {
      case SetupStep.CHANNEL_SELECT:
        return {
          embed: buildStep1Embed(),
          components: buildStep1Components(),
        };
      case SetupStep.WALLET_CONFIG:
        return {
          embed: buildStep2Embed(session),
          components: buildStep2Components(!!session.data.walletAddress),
        };
      case SetupStep.FEATURE_TOGGLES:
        return {
          embed: buildStep3Embed(session),
          components: buildStep3Components(session),
        };
      case SetupStep.SUMMARY_CONFIRM:
        return {
          embed: buildStep4Embed(session),
          components: buildStep4Components(),
        };
      default:
        throw new Error(`Invalid step: ${session.currentStep}`);
    }
  }
}
