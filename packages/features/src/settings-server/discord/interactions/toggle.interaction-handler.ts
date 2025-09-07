import { BaseInteractionHandler } from '@soldecoder-monitor/features-sdk';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { ButtonInteraction } from 'discord.js';
import type { GetServerSettingsUseCase, UpdateServerSettingsUseCase } from '../../core/application';
import { GetServerSettingsCommand } from '../../core/application/commands/get-server-settings.command';
import { UpdateServerSettingsCommand } from '../../core/application/commands/update-server-settings.command';
import { buildServerSettingsEmbed } from '../ui/server-settings.embed';
import { buildServerSettingsComponents } from '../ui/server-settings-components.builder';

/**
 * Handler for toggle button interactions (position display, forward TP/SL)
 */
export class ToggleInteractionHandler extends BaseInteractionHandler {
  constructor(
    private readonly getServerSettingsUseCase: GetServerSettingsUseCase,
    private readonly updateServerSettingsUseCase: UpdateServerSettingsUseCase,
  ) {
    super(createFeatureLogger('settings-server-toggle'));
  }

  async handle(interaction: ButtonInteraction): Promise<void> {
    const customIdParts = this.parseCustomId(interaction.customId);
    const action = customIdParts[2]; // settings-server:toggle:{action}

    await this.safeDefer(interaction);

    try {
      const guild = this.validateGuildContext(interaction);

      // Get current settings to determine new state
      const getCommand = new GetServerSettingsCommand(guild.id);
      const currentResult = await this.getServerSettingsUseCase.execute(getCommand, guild);
      const currentSettings = currentResult.guildSettings;

      // Determine updates based on action
      let updates: {
        positionDisplayEnabled?: boolean;
        forward?: boolean;
        summaryPreferences?: {
          weeklySummary?: boolean;
          monthlySummary?: boolean;
        };
      } = {};

      switch (action) {
        case 'positionDisplay':
          updates = { positionDisplayEnabled: !currentSettings.positionDisplayEnabled };
          break;
        case 'forward':
          updates = { forward: !currentSettings.forward };
          break;
        case 'weeklySummary':
          updates = {
            summaryPreferences: {
              weeklySummary: !currentSettings.summaryPreferences.weeklySummary,
            },
          };
          break;
        case 'monthlySummary':
          updates = {
            summaryPreferences: {
              monthlySummary: !currentSettings.summaryPreferences.monthlySummary,
            },
          };
          break;
        default:
          throw new Error(`Unknown toggle action: ${action}`);
      }

      // Update settings
      const updateCommand = new UpdateServerSettingsCommand(guild.id, updates);
      await this.updateServerSettingsUseCase.execute(updateCommand);

      // Refresh the UI
      await this.refreshServerSettings(interaction);
    } catch (error) {
      await this.handleErrorWithReset(interaction, error, () => this.refreshServerSettings(interaction));
    }
  }

  private async refreshServerSettings(interaction: ButtonInteraction): Promise<void> {
    const guild = this.validateGuildContext(interaction);
    const getCommand = new GetServerSettingsCommand(guild.id);
    const result = await this.getServerSettingsUseCase.execute(getCommand, guild);

    const embed = buildServerSettingsEmbed(result);
    const components = buildServerSettingsComponents(result.guildSettings);

    await this.safeUpdateReply(interaction, { embeds: [embed], components });
  }
}
