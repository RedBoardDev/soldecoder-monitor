import type { ChannelConfigRepository } from '@soldecoder-monitor/data';
import type { Guild } from 'discord.js';
import { ChannelConfigNotFoundError } from '../../domain/errors/settings-channels.errors';
import type { GetChannelConfigCommand } from '../commands/get-channel-config.command';
import { ChannelConfigResult } from '../results/channel-config.result';

/**
 * Use Case: Get Channel Configuration
 * Returns the configuration for a specific channel
 */
export class GetChannelConfigUseCase {
  constructor(private readonly channelConfigRepository: ChannelConfigRepository) {}

  async execute(command: GetChannelConfigCommand, guild: Guild): Promise<ChannelConfigResult> {
    // Get channel configuration
    const channelConfig = await this.channelConfigRepository.getByChannelId(command.channelId);
    if (!channelConfig) {
      throw new ChannelConfigNotFoundError(command.channelId);
    }

    // Get channel name
    const channel = guild.channels.cache.get(command.channelId);
    const channelName = channel?.name || 'Unknown Channel';

    return new ChannelConfigResult(channelConfig, channelName);
  }
}
