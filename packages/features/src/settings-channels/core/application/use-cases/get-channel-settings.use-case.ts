import type { ChannelConfigRepository } from '@soldecoder-monitor/data';
import type { Guild } from 'discord.js';
import { ChannelType } from 'discord.js';
import type { ChannelInfo } from '../../domain/types/settings-channels.types';
import type { GetChannelSettingsCommand } from '../commands/get-channel-settings.command';
import { ChannelSettingsResult } from '../results/channel-settings.result';

/**
 * Use Case: Get Channel Settings Overview
 * Returns all configured channels and available channels for a guild
 */
export class GetChannelSettingsUseCase {
  constructor(private readonly channelConfigRepository: ChannelConfigRepository) {}

  async execute(command: GetChannelSettingsCommand, guild: Guild): Promise<ChannelSettingsResult> {
    // Get all configured channels for this guild
    const channelConfigs = await this.channelConfigRepository.getByGuildId(command.guildId);

    // Get all text channels from the guild
    const allGuildChannels = guild.channels.cache
      .filter((ch) => ch.type === ChannelType.GuildText)
      .map((ch) => ({ id: ch.id, name: ch.name }));

    // Filter out channels that are already configured
    const availableChannels: ChannelInfo[] = allGuildChannels.filter(
      (guildChannel) => !channelConfigs.some((config) => config.channelId === guildChannel.id),
    );

    return new ChannelSettingsResult(command.guildId, channelConfigs, availableChannels, channelConfigs.length);
  }
}
