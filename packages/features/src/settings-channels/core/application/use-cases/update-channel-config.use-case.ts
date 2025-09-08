import type { ChannelConfigRepository } from '@soldecoder-monitor/data';
import type { Guild } from 'discord.js';
import { ChannelConfigNotFoundError } from '../../domain/errors/settings-channels.errors';
import type { ChannelConfigUpdates, UpdateChannelConfigCommand } from '../commands/update-channel-config.command';
import { UpdateChannelConfigResult } from '../results/update-channel-config.result';

export class UpdateChannelConfigUseCase {
  constructor(private readonly channelConfigRepository: ChannelConfigRepository) {}

  async execute(command: UpdateChannelConfigCommand, guild: Guild): Promise<UpdateChannelConfigResult> {
    const existingConfig = await this.channelConfigRepository.getByChannelId(command.channelId);
    if (!existingConfig) {
      throw new ChannelConfigNotFoundError(command.channelId);
    }

    const channel = guild.channels.cache.get(command.channelId);
    const channelName = channel?.name || 'Unknown Channel';

    const updatedConfig = existingConfig.update(command.updates);

    await this.channelConfigRepository.save(updatedConfig);

    const updatedFields = this.getUpdatedFieldNames(command.updates);

    return new UpdateChannelConfigResult(updatedConfig, channelName, updatedFields);
  }

  private getUpdatedFieldNames(updates: ChannelConfigUpdates): string[] {
    const fieldNames: string[] = [];

    if (updates.image !== undefined) fieldNames.push('Position Images');
    if (updates.pin !== undefined) fieldNames.push('Auto-Pin');
    if (updates.threshold !== undefined) fieldNames.push('Alert Threshold');
    if (updates.tagType !== undefined || updates.tagId !== undefined) fieldNames.push('Mentions');

    return fieldNames;
  }
}
