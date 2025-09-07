import { DynamoGuildSettingsRepository } from '@soldecoder-monitor/data';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { ChatInputCommandInteraction } from 'discord.js';
import { GuildRequiredError } from '../../../shared/domain';
import { GuildAlreadyRegisteredError, SessionAlreadyExistsError, type SetupSessionService } from '../../core';
import { buildStep1Components, buildStep1Embed } from '../ui/steps';

const logger = createFeatureLogger('register-process-start');

export class StartCommandHandler {
  private readonly guildSettingsRepository: DynamoGuildSettingsRepository;

  constructor(private readonly sessionService: SetupSessionService) {
    this.guildSettingsRepository = DynamoGuildSettingsRepository.create();
  }

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply({ ephemeral: true });

    try {
      const guildId = interaction.guildId;
      if (!guildId) throw new GuildRequiredError();

      const userId = interaction.user.id;

      const existingGuildSettings = await this.guildSettingsRepository.getByGuildId(guildId);
      if (existingGuildSettings) {
        throw new GuildAlreadyRegisteredError(guildId);
      }

      try {
        const _session = this.sessionService.createSession(guildId, userId);
        await this.sendStep1Reply(interaction, guildId, userId);
        logger.info('Started register process', { guildId, userId });
      } catch (error) {
        if (error instanceof SessionAlreadyExistsError) {
          this.sessionService.deleteSession(guildId, userId);
          const _session = this.sessionService.createSession(guildId, userId);
          await this.sendStep1Reply(interaction, guildId, userId);
          logger.info('Restarted register process (deleted old session)', { guildId, userId });
        } else {
          throw error;
        }
      }
    } catch (error) {
      await this.handleError(interaction, error);
    }
  }

  private async sendStep1Reply(
    interaction: ChatInputCommandInteraction,
    guildId: string,
    userId: string,
  ): Promise<void> {
    const embed = buildStep1Embed();
    const components = buildStep1Components();

    const message = await interaction.editReply({
      embeds: [embed],
      components,
    });

    if (typeof message !== 'string' && message.id) {
      if (interaction.channelId) {
        this.sessionService.setLastMessageInfo(guildId, userId, message.id, interaction.channelId);
      }
    }
  }

  private async handleError(interaction: ChatInputCommandInteraction, error: unknown): Promise<void> {
    logger.error('Start command failed', error as Error, {
      guildId: interaction.guildId,
      userId: interaction.user.id,
    });

    let message: string;

    if (error instanceof GuildRequiredError) {
      message = '❌ This command can only be used in a server.';
    } else if (error instanceof GuildAlreadyRegisteredError) {
      message = error.message;
    } else if (error instanceof SessionAlreadyExistsError) {
      message = '❌ A setup session is already in progress. Please complete or cancel it first.';
    } else {
      message = '❌ An unexpected error occurred. Please try again later.';
      logger.error('Unexpected error in start command', error as Error);
    }

    try {
      await interaction.editReply({ content: message, embeds: [], components: [] });
    } catch (replyError) {
      logger.error('Failed to send error reply', replyError as Error);
    }
  }
}
