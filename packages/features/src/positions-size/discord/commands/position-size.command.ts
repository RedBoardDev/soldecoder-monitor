import { DiscordZodTypes, getOptions } from '@soldecoder-monitor/discord';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { z } from 'zod';
import { DomainError, GuildRequiredError } from '../../../shared/domain';
import { CalculatePositionSizesCommand } from '../../core/application/commands/calculate-position-sizes.command';
import type { CalculatePositionSizesUseCase } from '../../core/application/use-cases/calculate-position-sizes.use-case';
import {
  buildPositionSizeRecommendationsEmbed,
  buildPositionSizeSettingsFallbackEmbed,
} from '../ui/position-size-recommendations.embed';

const logger = createFeatureLogger('position-size-command');

const positionSizeOptionsSchema = z.object({
  wallet: DiscordZodTypes.string().nullable(),
  stoploss: DiscordZodTypes.number().nullable(),
  current_size: DiscordZodTypes.number().nullable(),
});

export type PositionSizeOptions = z.infer<typeof positionSizeOptionsSchema>;

export class PositionSizeCommandHandler {
  constructor(private readonly calculatePositionSizesUseCase: CalculatePositionSizesUseCase) {}

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    try {
      const guildId = interaction.guildId;
      if (!guildId) throw new GuildRequiredError();

      const options = getOptions(interaction, positionSizeOptionsSchema);
      const command = CalculatePositionSizesCommand.fromOptions(guildId, options);

      const result = await this.calculatePositionSizesUseCase.execute(command);

      // Choose appropriate embed  on whether calculations succeeded
      const calculationData = result.getCalculationData();
      let embed: EmbedBuilder;

      if (calculationData) {
        embed = buildPositionSizeRecommendationsEmbed({
          shortWallet: result.walletAddress.shortAddress,
          netWorth: calculationData.totalNetWorth,
          stoploss: result.stopLossPercent,
          currentSize: result.currentSize,
          items: calculationData.positionItems,
        });
      } else {
        // TODO mmh voir ça
        embed = buildPositionSizeSettingsFallbackEmbed({
          shortWallet: result.walletAddress.shortAddress,
          stopLossPercent: result.stopLossPercent,
          currentSize: result.currentSize,
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      await this.handleError(interaction, error);
    }
  }

  /**
   * Handle errors with appropriate Discord responses
   */
  private async handleError(interaction: ChatInputCommandInteraction, error: unknown): Promise<void> {
    logger.error('Position size command failed', error as Error, {
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
      logger.error('Unexpected error in position-size command', error as Error);
    }

    try {
      await interaction.editReply({ content: message });
    } catch (replyError) {
      logger.error('Failed to send error reply', replyError as Error);
    }
  }
}
