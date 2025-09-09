import { GuildSettingsEntity, type GuildSettingsRepository } from '@soldecoder-monitor/data';
import { GuildSettingsNotFoundError } from '../../domain/errors/settings-server.errors';
import type { UpdateServerSettingsCommand } from '../commands/update-server-settings.command';
import { UpdateServerSettingsResult } from '../results/update-server-settings.result';

export class UpdateServerSettingsUseCase {
  constructor(private readonly guildSettingsRepository: GuildSettingsRepository) {}

  async execute(command: UpdateServerSettingsCommand): Promise<UpdateServerSettingsResult> {
    const existingSettings = await this.guildSettingsRepository.getByGuildId(command.guildId);

    if (!existingSettings) {
      throw new GuildSettingsNotFoundError(command.guildId);
    }

    const updatedFields: string[] = [];

    // Merge updates with existing settings
    const mergedPositionSizeDefaults = command.updates.positionSizeDefaults
      ? {
          walletAddress:
            command.updates.positionSizeDefaults.walletAddress !== undefined
              ? command.updates.positionSizeDefaults.walletAddress
              : existingSettings.positionSizeDefaults.walletAddress,
          stopLossPercent:
            command.updates.positionSizeDefaults.stopLossPercent !== undefined
              ? command.updates.positionSizeDefaults.stopLossPercent
              : existingSettings.positionSizeDefaults.stopLossPercent,
        }
      : existingSettings.positionSizeDefaults;

    if (command.updates.positionSizeDefaults) {
      updatedFields.push('Position Size Defaults');
    }

    // Merge summary preferences
    const mergedSummaryPreferences = command.updates.summaryPreferences
      ? {
          weeklySummary:
            command.updates.summaryPreferences.weeklySummary !== undefined
              ? command.updates.summaryPreferences.weeklySummary
              : existingSettings.summaryPreferences.weeklySummary,
          monthlySummary:
            command.updates.summaryPreferences.monthlySummary !== undefined
              ? command.updates.summaryPreferences.monthlySummary
              : existingSettings.summaryPreferences.monthlySummary,
          dailySummary: existingSettings.summaryPreferences.dailySummary,
        }
      : existingSettings.summaryPreferences;

    if (command.updates.summaryPreferences) {
      if (command.updates.summaryPreferences.weeklySummary !== undefined) {
        updatedFields.push('Weekly Summary');
      }
      if (command.updates.summaryPreferences.monthlySummary !== undefined) {
        updatedFields.push('Monthly Summary');
      }
    }

    // Create updated entity
    const updatedSettings = GuildSettingsEntity.create({
      guildId: existingSettings.guildId,
      timezone: existingSettings.timezone,
      positionDisplayEnabled:
        command.updates.positionDisplayEnabled !== undefined
          ? command.updates.positionDisplayEnabled
          : existingSettings.positionDisplayEnabled,
      autoDeleteWarnings: existingSettings.autoDeleteWarnings,
      globalChannelId:
        command.updates.globalChannelId !== undefined
          ? command.updates.globalChannelId
          : existingSettings.globalChannelId,
      forward: command.updates.forward !== undefined ? command.updates.forward : existingSettings.forward,
      summaryPreferences: mergedSummaryPreferences,
      positionSizeDefaults: mergedPositionSizeDefaults,
      createdAt: existingSettings.createdAt,
    });

    // Track updated fields
    if (command.updates.positionDisplayEnabled !== undefined) {
      updatedFields.push('Position Display');
    }
    if (command.updates.globalChannelId !== undefined) {
      updatedFields.push('Global Channel');
    }
    if (command.updates.forward !== undefined) {
      updatedFields.push('Forward');
    }

    await this.guildSettingsRepository.save(updatedSettings);

    return new UpdateServerSettingsResult(updatedSettings, updatedFields);
  }
}
