import { GuildSettingsEntity, type GuildSettingsRepository } from '@soldecoder-monitor/data';
import { GuildSettingsNotFoundError } from '../../domain/errors/settings-server.errors';
import type { UpdateServerSettingsCommand } from '../commands/update-server-settings.command';
import { UpdateServerSettingsResult } from '../results/update-server-settings.result';

/**
 * Use Case: Update Server Settings
 * Updates specific guild settings and returns the updated entity
 */
export class UpdateServerSettingsUseCase {
  constructor(private readonly guildSettingsRepository: GuildSettingsRepository) {}

  async execute(command: UpdateServerSettingsCommand): Promise<UpdateServerSettingsResult> {
    const existingSettings = await this.guildSettingsRepository.getByGuildId(command.guildId);

    if (!existingSettings) {
      throw new GuildSettingsNotFoundError(command.guildId);
    }

    // Track which fields are being updated
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
      forwardTpSl:
        command.updates.forwardTpSl !== undefined ? command.updates.forwardTpSl : existingSettings.forwardTpSl,
      summaryPreferences: existingSettings.summaryPreferences,
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
    if (command.updates.forwardTpSl !== undefined) {
      updatedFields.push('Forward TP/SL');
    }

    await this.guildSettingsRepository.save(updatedSettings);

    return new UpdateServerSettingsResult(updatedSettings, updatedFields);
  }
}
