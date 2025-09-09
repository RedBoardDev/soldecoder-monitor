import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { ButtonInteraction } from 'discord.js';
import { type SetupSession, type SetupSessionService, SetupStep } from '../../../core';
import { buildStep3Components, buildStep3Embed, buildStep4Components, buildStep4Embed } from '../../ui/steps';

const logger = createFeatureLogger('register-process-toggles');

export class FeatureTogglesHandler {
  constructor(private readonly sessionService: SetupSessionService) {}

  async handle(interaction: ButtonInteraction, session: SetupSession): Promise<void> {
    const action = interaction.customId.split(':')[2]; // register-process:step3:{action}

    if (action === 'continue') {
      this.sessionService.updateStep(session.guildId, session.userId, SetupStep.SUMMARY_CONFIRM);

      const embed = buildStep4Embed(session);
      const components = buildStep4Components();

      await interaction.editReply({
        embeds: [embed],
        components,
      });
    } else {
      const currentData = session.data;
      let updates: Partial<typeof currentData> = {};

      switch (action) {
        case 'toggle-position':
          updates = { positionDisplayEnabled: !currentData.positionDisplayEnabled };
          break;
        case 'toggle-forward':
          updates = { forward: !currentData.forward };
          break;
        case 'toggle-weekly-summary':
          updates = {
            summaryPreferences: {
              ...currentData.summaryPreferences,
              weeklySummary: !currentData.summaryPreferences?.weeklySummary,
            },
          };
          break;
        case 'toggle-monthly-summary':
          updates = {
            summaryPreferences: {
              ...currentData.summaryPreferences,
              monthlySummary: !currentData.summaryPreferences?.monthlySummary,
            },
          };
          break;
        default:
          logger.warn('Unknown toggle action', { action });
          return;
      }

      const updatedSession = this.sessionService.updateData(session.guildId, session.userId, updates);

      const embed = buildStep3Embed(updatedSession);
      const components = buildStep3Components(updatedSession);

      await interaction.editReply({
        embeds: [embed],
        components,
      });
    }
  }
}
