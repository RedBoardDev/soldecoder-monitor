import type { ChannelConfigRepository } from '@soldecoder-monitor/data';
import type { Guild } from 'discord.js';
import { ChannelConfigNotFoundError } from '../../domain/errors/settings-channels.errors';
import type { ChannelConfigUpdates, UpdateChannelConfigCommand } from '../commands/update-channel-config.command';
import { UpdateChannelConfigResult } from '../results/update-channel-config.result';

/**
 * Use Case: Update Channel Configuration
 * Updates specific settings for a channel configuration
 */
export class UpdateChannelConfigUseCase {
  constructor(private readonly channelConfigRepository: ChannelConfigRepository) {}

  async execute(command: UpdateChannelConfigCommand, guild: Guild): Promise<UpdateChannelConfigResult> {
    // Get existing configuration
    const existingConfig = await this.channelConfigRepository.getByChannelId(command.channelId);
    if (!existingConfig) {
      throw new ChannelConfigNotFoundError(command.channelId);
    }

    // Get channel name
    const channel = guild.channels.cache.get(command.channelId);
    const channelName = channel?.name || 'Unknown Channel';

    // Apply updates using the entity's update method
    const updatedConfig = existingConfig.update(command.updates);

    // Save updated configuration
    await this.channelConfigRepository.save(updatedConfig);

    // Track what fields were updated for user feedback
    const updatedFields = this.getUpdatedFieldNames(command.updates);

    return new UpdateChannelConfigResult(updatedConfig, channelName, updatedFields);
  }

  private getUpdatedFieldNames(updates: ChannelConfigUpdates): string[] {
    const fieldNames: string[] = [];

    if (updates.notifyOnClose !== undefined) fieldNames.push('Close Alerts');
    if (updates.image !== undefined) fieldNames.push('Position Images');
    if (updates.pin !== undefined) fieldNames.push('Auto-Pin');
    if (updates.threshold !== undefined) fieldNames.push('Alert Threshold');
    if (updates.tagType !== undefined || updates.tagId !== undefined) fieldNames.push('Mentions');

    return fieldNames;
  }
}
