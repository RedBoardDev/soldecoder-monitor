import type { ChannelConfigRepository } from '@soldecoder-monitor/data';
import type { Guild } from 'discord.js';
import { ChannelConfigNotFoundError } from '../../domain/errors/settings-channels.errors';
import type { RemoveChannelCommand } from '../commands/remove-channel.command';
import { RemoveChannelResult } from '../results/remove-channel.result';

/**
 * Use Case: Remove Channel from Monitoring Configuration
 * Removes a channel configuration and cleans up associated data
 */
export class RemoveChannelUseCase {
  constructor(private readonly channelConfigRepository: ChannelConfigRepository) {}

  async execute(command: RemoveChannelCommand, guild: Guild): Promise<RemoveChannelResult> {
    // Check if channel configuration exists
    const existingConfig = await this.channelConfigRepository.getByChannelId(command.channelId);
    if (!existingConfig) {
      throw new ChannelConfigNotFoundError(command.channelId);
    }

    // Get channel name for result
    const channel = guild.channels.cache.get(command.channelId);
    const channelName = channel?.name || 'Unknown Channel';

    // Remove configuration
    await this.channelConfigRepository.delete(command.channelId);

    return new RemoveChannelResult(command.channelId, channelName, true);
  }
}
