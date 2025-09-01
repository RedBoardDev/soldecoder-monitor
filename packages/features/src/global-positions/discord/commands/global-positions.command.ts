import { getOptions } from '@soldecoder-monitor/discord';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { ChatInputCommandInteraction } from 'discord.js';
import { DomainError, GuildRequiredError } from '../../../shared/domain';
import { GetGlobalPositionsCommand } from '../../core/application/commands/get-global-positions.command';
import type { GetGlobalPositionsUseCase } from '../../core/application/use-cases/get-global-positions.use-case';
import { globalPositionsOptionsSchema } from '../../core/domain/types/global-positions.types';
import { buildGlobalPositionsEmbed } from '../ui/global-positions.embed';

const logger = createFeatureLogger('global-positions-command');

export class GlobalPositionsCommandHandler {
  constructor(private readonly getGlobalPositionsUseCase: GetGlobalPositionsUseCase) {}

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    try {
      const { guild, guildId } = interaction;
      if (!guild || !guildId) throw new GuildRequiredError();

      const options = getOptions(interaction, globalPositionsOptionsSchema);
      const command = GetGlobalPositionsCommand.fromOptions(guildId, options);

      const result = await this.getGlobalPositionsUseCase.execute(guild, command);

      const embed = buildGlobalPositionsEmbed({
        positionsByWallet: result.positionsByWallet,
        percentOnly: result.isPercentOnlyMode(),
        footerText: 'soldecoder-monitor',
      });

      // TODO: Add donate button component when available
      // const components = [buildDonateButton()];

      await interaction.editReply({
        embeds: [embed],
        // components,
      });
    } catch (error) {
      await this.handleError(interaction, error);
    }
  }

  /**
   * Handle errors with appropriate Discord responses
   */
  private async handleError(interaction: ChatInputCommandInteraction, error: unknown): Promise<void> {
    logger.error('Global positions command failed', error as Error, {
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
      logger.error('Unexpected error in global-positions command', error as Error);
    }

    try {
      await interaction.editReply({ content: message });
    } catch (replyError) {
      logger.error('Failed to send error reply', replyError as Error);
    }
  }
}
