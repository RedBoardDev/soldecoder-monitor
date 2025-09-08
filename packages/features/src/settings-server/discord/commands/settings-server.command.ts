import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { ChatInputCommandInteraction } from 'discord.js';
import { DomainError, GuildRequiredError } from '../../../shared/domain';
import type { GetServerSettingsUseCase } from '../../core/application';
import { GetServerSettingsCommand } from '../../core/application/commands/get-server-settings.command';
import { buildServerSettingsEmbed } from '../ui/server-settings.embed';
import { buildServerSettingsComponents } from '../ui/server-settings-components.builder';

const logger = createFeatureLogger('settings-server-command');

export class SettingsServerCommandHandler {
  constructor(private readonly getServerSettingsUseCase: GetServerSettingsUseCase) {}

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    try {
      const guildId = interaction.guildId;
      if (!guildId) throw new GuildRequiredError();

      const command = new GetServerSettingsCommand(guildId);

      if (!interaction.guild) {
        throw new GuildRequiredError();
      }

      const result = await this.getServerSettingsUseCase.execute(command, interaction.guild);

      const embed = buildServerSettingsEmbed(result);
      const components = buildServerSettingsComponents(result.guildSettings);

      await interaction.editReply({ embeds: [embed], components });
    } catch (error) {
      await this.handleError(interaction, error);
    }
  }

  private async handleError(interaction: ChatInputCommandInteraction, error: unknown): Promise<void> {
    logger.error('Settings server command failed', error as Error, {
      guildId: interaction.guildId,
      userId: interaction.user.id,
    });

    let message: string;

    if (error instanceof DomainError) {
      message = error.message;
      logger.debug('Domain error handled', error.toLogContext());
    } else {
      message = '❌ An unexpected error occurred. Please try again later.';
      logger.error('Unexpected error in settings-server command', error as Error);
    }

    try {
      await interaction.editReply({ content: message });
    } catch (replyError) {
      logger.error('Failed to send error reply', replyError as Error);
    }
  }
}
