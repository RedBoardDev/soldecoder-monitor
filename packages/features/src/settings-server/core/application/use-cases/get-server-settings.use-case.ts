import type { GuildSettingsRepository } from '@soldecoder-monitor/data';
import type { Guild } from 'discord.js';
import { GuildSettingsNotFoundError } from '../../domain/errors/settings-server.errors';
import type { GetServerSettingsCommand } from '../commands/get-server-settings.command';
import { ServerSettingsResult } from '../results/server-settings.result';

export class GetServerSettingsUseCase {
  constructor(private readonly guildSettingsRepository: GuildSettingsRepository) {}

  async execute(command: GetServerSettingsCommand, guild: Guild): Promise<ServerSettingsResult> {
    const guildSettings = await this.guildSettingsRepository.getByGuildId(command.guildId);

    if (!guildSettings) {
      throw new GuildSettingsNotFoundError(command.guildId);
    }

    let globalChannelName: string | undefined;
    if (guildSettings.globalChannelId) {
      const channel = guild.channels.cache.get(guildSettings.globalChannelId);
      globalChannelName = channel?.name;
    }

    return new ServerSettingsResult(guildSettings, globalChannelName);
  }
}
