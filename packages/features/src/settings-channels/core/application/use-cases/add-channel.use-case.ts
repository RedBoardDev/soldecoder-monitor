import type { ChannelConfigRepository } from '@soldecoder-monitor/data';
import { ChannelConfigEntity } from '@soldecoder-monitor/data';
import type { PermissionValidatorService } from '@soldecoder-monitor/discord';
import type { Guild } from 'discord.js';
import { ChannelType } from 'discord.js';
import { ChannelAlreadyConfiguredError } from '../../domain/errors/settings-channels.errors';
import type { AddChannelCommand } from '../commands/add-channel.command';
import { AddChannelResult } from '../results/add-channel.result';

/**
 * Use Case: Add Channel to Monitoring Configuration
 * Validates permissions and creates a new channel configuration with default settings
 */
export class AddChannelUseCase {
  constructor(
    private readonly channelConfigRepository: ChannelConfigRepository,
    private readonly permissionValidator: PermissionValidatorService,
  ) {}

  async execute(command: AddChannelCommand, guild: Guild): Promise<AddChannelResult> {
    // Check if channel exists in guild
    const channel = guild.channels.cache.get(command.channelId);
    if (!channel) {
      throw new Error(`Channel ${command.channelId} not found in guild`);
    }

    // Validate channel type
    if (channel.type !== ChannelType.GuildText) {
      throw new Error(`Channel ${channel.name} is not a text channel (type: ${ChannelType[channel.type]})`);
    }

    // Check if channel is already configured
    const existingConfig = await this.channelConfigRepository.getByChannelId(command.channelId);
    if (existingConfig) {
      throw new ChannelAlreadyConfiguredError(command.channelId, channel.name);
    }

    // Validate basic channel access permissions
    await this.permissionValidator.validateChannelAccess(guild, command.channelId);

    // Create new channel configuration with default settings
    const newConfig = {
      channelId: command.channelId,
      guildId: command.guildId,
      image: false,
      notifyOnClose: true, // Enable notifications by default
      pin: false,
      tagType: null,
      tagId: null,
      threshold: null,
      createdAt: Date.now(),
    } as const;

    // Create entity
    const channelConfig = ChannelConfigEntity.create(newConfig);

    // Save configuration
    await this.channelConfigRepository.save(channelConfig);

    return new AddChannelResult(channelConfig, channel.name, true);
  }
}
