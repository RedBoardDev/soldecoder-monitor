import type { ChannelConfigRepository } from '@soldecoder-monitor/data';
import { ChannelConfigEntity } from '@soldecoder-monitor/data';
import type { PermissionValidatorService } from '@soldecoder-monitor/discord';
import type { Guild } from 'discord.js';
import { ChannelType } from 'discord.js';
import { ChannelAlreadyConfiguredError } from '../../domain/errors/settings-channels.errors';
import type { AddChannelCommand } from '../commands/add-channel.command';
import { AddChannelResult } from '../results/add-channel.result';

export class AddChannelUseCase {
  constructor(
    private readonly channelConfigRepository: ChannelConfigRepository,
    private readonly permissionValidator: PermissionValidatorService,
  ) {}

  async execute(command: AddChannelCommand, guild: Guild): Promise<AddChannelResult> {
    const channel = guild.channels.cache.get(command.channelId);
    if (!channel) {
      throw new Error(`Channel ${command.channelId} not found in guild`);
    }

    if (channel.type !== ChannelType.GuildText) {
      throw new Error(`Channel ${channel.name} is not a text channel (type: ${ChannelType[channel.type]})`);
    }

    const existingConfig = await this.channelConfigRepository.getByChannelId(command.channelId);
    if (existingConfig) {
      throw new ChannelAlreadyConfiguredError(command.channelId, channel.name);
    }

    await this.permissionValidator.validateChannelAccess(guild, command.channelId);

    const newConfig = {
      channelId: command.channelId,
      guildId: command.guildId,
      image: false,
      pin: false,
      tagType: null,
      tagId: null,
      threshold: null,
      createdAt: Date.now(),
    } as const;

    const channelConfig = ChannelConfigEntity.create(newConfig);

    await this.channelConfigRepository.save(channelConfig);

    return new AddChannelResult(channelConfig, channel.name, true);
  }
}
