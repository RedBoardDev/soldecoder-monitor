import { DynamoGuildSettingsRepository } from '@soldecoder-monitor/data';
import type { Guard, GuardContext } from '@soldecoder-monitor/features-sdk';
import type { ChatInputCommandInteraction } from 'discord.js';

export class GuildConfigGuard implements Guard {
  private repository: DynamoGuildSettingsRepository | null = null;

  constructor(
    private readonly errorMessage = '❌ Server configuration not found. Please run `/start` first to set up your server.',
  ) {}

  private getRepository(): DynamoGuildSettingsRepository {
    if (!this.repository) {
      this.repository = DynamoGuildSettingsRepository.create();
    }
    return this.repository;
  }

  async canActivate(context: GuardContext): Promise<boolean> {
    const interaction = context.interaction as ChatInputCommandInteraction;

    if (!interaction.guildId) {
      return false; // Should not happen since commands are guild-only, but safety check
    }

    try {
      const guildSettings = await this.getRepository().getByGuildId(interaction.guildId);
      return guildSettings !== null;
    } catch (error) {
      console.error('Error checking guild configuration:', error);
      return false;
    }
  }

  async onFail(context: GuardContext): Promise<void> {
    const interaction = context.interaction as ChatInputCommandInteraction;

    if ('reply' in interaction && !interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: this.errorMessage,
        ephemeral: true,
      });
    }
  }
}
