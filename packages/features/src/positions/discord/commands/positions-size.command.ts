import { DiscordZodTypes, getOptions } from '@soldecoder-monitor/discord';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { ChatInputCommandInteraction } from 'discord.js';
import { EmbedBuilder } from 'discord.js';
import { z } from 'zod';
import { DomainError, GuildRequiredError } from '../../../shared/domain';
import { 
  type CalculatePositionRecommendationsUseCase, 
  GetPositionSettingsCommand,
  PositionRecommendationsResult,
} from '../../core/application';
import { buildPositionSizeRecommendationsEmbed } from '../ui';

const logger = createFeatureLogger('positions-size-command');

const positionSizeOptionsSchema = z.object({
  wallet: DiscordZodTypes.string().optional(),
  stoploss: DiscordZodTypes.number().optional(),
  current_size: DiscordZodTypes.number().optional(),
});

export type PositionSizeOptions = z.infer<typeof positionSizeOptionsSchema>;

export class PositionsSizeCommandHandler {
  constructor(private readonly calculatePositionRecommendationsUseCase: CalculatePositionRecommendationsUseCase) {}

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    try {
      const guildId = interaction.guildId;
      if (!guildId) throw new GuildRequiredError();

      const options = getOptions(interaction, positionSizeOptionsSchema);
      const command = GetPositionSettingsCommand.fromOptions(guildId, options);

      const result = await this.calculatePositionRecommendationsUseCase.execute(command);

      let embed: EmbedBuilder;

      if (result instanceof PositionRecommendationsResult) {
        // Success case: show position size recommendations
        embed = buildPositionSizeRecommendationsEmbed({
          shortWallet: result.getShortWalletAddress(),
          netWorth: result.totalNetWorth,
          stoploss: result.stopLossPercent,
          currentSize: result.currentSize,
          items: result.positionItems,
        });

        logger.info('Position recommendations displayed successfully', {
          guildId: result.guildId,
          shortWallet: result.getShortWalletAddress(),
          totalNetWorth: result.totalNetWorth,
          itemsCount: result.positionItems.length,
        });
      } else {
        // Fallback case: show settings only when wallet service fails
        embed = new EmbedBuilder()
          .setTitle('⚠️ Position Settings Retrieved')
          .setColor(0xffa500)
          .setDescription(
            [
              `📍 **Wallet:** \`${result.getShortWalletAddress()}\``,
              `📉 **Stop Loss:** \`${result.stopLossPercent}%\``,
              result.currentSize ? `📊 **Current Size:** \`${result.currentSize} SOL\`` : null,
            ]
              .filter(Boolean)
              .join(' • '),
          )
          .addFields(
            {
              name: 'ℹ️ Configuration Info',
              value: result.getDefaultsUsageSummary(),
              inline: false,
            },
            {
              name: '⚠️ Position Calculations Unavailable',
              value: 'Could not fetch wallet data for position size recommendations. Settings shown instead.',
              inline: false,
            },
          )
          .setTimestamp();

        logger.info('Position settings displayed (calculations unavailable)', {
          guildId: result.guildId,
          shortWallet: result.getShortWalletAddress(),
          defaultsUsed: result.getDefaultsUsageSummary(),
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
      logger.error('Unexpected error in positions-size command', error as Error);
    }

    try {
      await interaction.editReply({ content: message });
    } catch (replyError) {
      logger.error('Failed to send error reply', replyError as Error);
    }
  }
}
