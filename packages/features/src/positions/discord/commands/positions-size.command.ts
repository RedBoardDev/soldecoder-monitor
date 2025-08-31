import { DiscordZodTypes, getOptions } from '@soldecoder-monitor/discord';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { ChatInputCommandInteraction } from 'discord.js';
import { DomainError } from 'shared/domain/errors/domain-error.errors';
import { GuildRequiredError } from 'shared/domain/errors/guild-required.errors';
import { z } from 'zod';
import { GetPositionSettingsCommand } from '../../core/application/commands/get-position-settings.command';
import type { GetPositionSettingsUseCase } from '../../core/application/use-cases/get-position-settings.use-case';
import { buildPositionSettingsEmbed } from '../ui';

const logger = createFeatureLogger('positions-size-command');

const positionSizeOptionsSchema = z.object({
  wallet: DiscordZodTypes.string().optional(),
  stoploss: DiscordZodTypes.number().optional(),
  current_size: DiscordZodTypes.number().optional(),
});

export type PositionSizeOptions = z.infer<typeof positionSizeOptionsSchema>;

export class PositionsSizeCommandHandler {
  constructor(private readonly getPositionSettingsUseCase: GetPositionSettingsUseCase) {}

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    try {
      const guildId = interaction.guildId;
      if (!guildId) throw new GuildRequiredError();

      const options = getOptions(interaction, positionSizeOptionsSchema);
      const command = GetPositionSettingsCommand.fromOptions(guildId, options);

      logger.debug('Processing position size request', {
        guildId: command.guildId,
        hasWallet: command.hasWalletOverride(),
        hasStoploss: command.hasStoplossOverride(),
        hasCurrentSize: command.hasCurrentSize(),
      });

      const result = await this.getPositionSettingsUseCase.execute(command);

      logger.info('Position settings retrieved successfully', {
        guildId: result.guildId,
        shortWallet: result.getShortWalletAddress(),
        stoploss: result.stopLossPercent,
        defaultsUsed: result.getDefaultsUsageSummary(),
      });

      const embed = buildPositionSettingsEmbed({
        shortWallet: result.getShortWalletAddress(),
        stopLossPercent: result.stopLossPercent,
        currentSize: result.currentSize,
        defaultsUsageSummary: result.getDefaultsUsageSummary(),
      });

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
