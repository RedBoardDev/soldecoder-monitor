import { DynamoGuildSettingsRepository, GuildSettingsEntity } from '@soldecoder-monitor/data';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { ButtonInteraction } from 'discord.js';
import { SessionDataIncompleteError, type SetupSession, type SetupSessionService } from '../../../core';
import { buildStep5Embed } from '../../ui/steps';

const logger = createFeatureLogger('register-process-finalize');

export class FinalizeHandler {
  private readonly guildSettingsRepository: DynamoGuildSettingsRepository;

  constructor(private readonly sessionService: SetupSessionService) {
    this.guildSettingsRepository = DynamoGuildSettingsRepository.create();
  }

  async handle(interaction: ButtonInteraction, session: SetupSession): Promise<void> {
    if (!this.sessionService.isSessionComplete(session)) {
      const missingField = this.sessionService.getNextRequiredField(session);
      throw new SessionDataIncompleteError(missingField ? [missingField] : ['Unknown']);
    }

    try {
      const existingSettings = await this.guildSettingsRepository.getByGuildId(session.guildId);

      let settingsToSave: GuildSettingsEntity;

      if (!existingSettings) {
        // Create new settings with defaults
        settingsToSave = GuildSettingsEntity.create({
          guildId: session.guildId,
          positionDisplayEnabled: session.data.positionDisplayEnabled ?? true,
          globalChannelId: session.data.globalChannelId || null,
          timezone: 'UTC',
          forward: session.data.forward ?? true,
          autoDeleteWarnings: false,
          summaryPreferences: {
            dailySummary: false,
            weeklySummary: false,
            monthlySummary: false,
          },
          positionSizeDefaults: {
            walletAddress: session.data.walletAddress || null,
            stopLossPercent: session.data.stopLossPercent ?? null,
          },
          createdAt: Date.now(),
        });
      } else {
        // Update existing settings
        settingsToSave = GuildSettingsEntity.create({
          guildId: existingSettings.guildId,
          positionDisplayEnabled: session.data.positionDisplayEnabled ?? existingSettings.positionDisplayEnabled,
          globalChannelId: session.data.globalChannelId ?? existingSettings.globalChannelId ?? null,
          timezone: existingSettings.timezone,
          forward: session.data.forward ?? existingSettings.forward,
          autoDeleteWarnings: existingSettings.autoDeleteWarnings,
          summaryPreferences: existingSettings.summaryPreferences,
          positionSizeDefaults: {
            walletAddress: session.data.walletAddress ?? existingSettings.positionSizeDefaults.walletAddress,
            stopLossPercent: session.data.stopLossPercent ?? existingSettings.positionSizeDefaults.stopLossPercent,
          },
          createdAt: existingSettings.createdAt,
        });
      }

      await this.guildSettingsRepository.save(settingsToSave);

      const embed = buildStep5Embed();

      await interaction.editReply({
        embeds: [embed],
      });

      this.sessionService.deleteSession(session.guildId, session.userId);
    } catch (error) {
      logger.error('Failed to finalize setup', error as Error, {
        guildId: session.guildId,
        userId: session.userId,
      });

      await interaction.followUp({
        content: '❌ Failed to save configuration. Please try again.',
        ephemeral: true,
      });
    }
  }
}
