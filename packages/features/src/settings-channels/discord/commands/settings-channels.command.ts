import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { ChatInputCommandInteraction } from 'discord.js';
import { DomainError, GuildRequiredError } from '../../../shared/domain';
import type { GetChannelSettingsUseCase } from '../../core/application';
import { GetChannelSettingsCommand } from '../../core/application';
import { buildChannelListEmbed } from '../ui/channel-list.embed';
import { buildChannelListComponents } from '../ui/channel-list-components.builder';

const logger = createFeatureLogger('settings-channels-command');

export class SettingsChannelsCommandHandler {
  constructor(private readonly getChannelSettingsUseCase: GetChannelSettingsUseCase) {}

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    try {
      const guildId = interaction.guildId;
      if (!guildId) throw new GuildRequiredError();

      const command = new GetChannelSettingsCommand(guildId);

      if (!interaction.guild) {
        throw new GuildRequiredError();
      }

      const result = await this.getChannelSettingsUseCase.execute(command, interaction.guild);

      const embed = buildChannelListEmbed(result);

      // Get all guild channels for components
      const guildChannels = Array.from(interaction.guild.channels.cache.values())
        .filter((ch) => ch.type === 0) // GuildText
        .map((ch) => ({ id: ch.id, name: ch.name }));

      const components = buildChannelListComponents(result, guildChannels);

      await interaction.editReply({ embeds: [embed], components });
    } catch (error) {
      await this.handleError(interaction, error);
    }
  }

  /**
   * Handle errors with appropriate Discord responses
   */
  private async handleError(interaction: ChatInputCommandInteraction, error: unknown): Promise<void> {
    logger.error('Settings channels command failed', error as Error, {
      guildId: interaction.guildId,
      userId: interaction.user.id,
    });

    let message: string;

    if (error instanceof DomainError) {
      // Handle domain-specific errors with user-friendly messages
      message = error.message;
      logger.debug('Domain error handled', error.toLogContext());
    } else {
      // Handle unexpected errors
      message = '❌ An unexpected error occurred. Please try again later.';
      logger.error('Unexpected error in settings-channels command', error as Error);
    }

    try {
      await interaction.editReply({ content: message });
    } catch (replyError) {
      logger.error('Failed to send error reply', replyError as Error);
    }
  }
}
