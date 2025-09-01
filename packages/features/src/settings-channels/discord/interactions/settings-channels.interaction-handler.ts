import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { ButtonInteraction, ChannelSelectMenuInteraction, StringSelectMenuInteraction } from 'discord.js';
import { PermissionFlagsBits } from 'discord.js';
import { DomainError } from '../../../shared/domain';
import {
  AddChannelCommand,
  type AddChannelUseCase,
  GetChannelSettingsCommand,
  type GetChannelSettingsUseCase,
  RemoveChannelCommand,
  type RemoveChannelUseCase,
} from '../../core/application';
import { buildChannelListEmbed } from '../ui/channel-list.embed';
import { buildChannelListComponents } from '../ui/channel-list-components.builder';

const logger = createFeatureLogger('settings-channels-interactions');

export class SettingsChannelsInteractionHandler {
  constructor(
    private readonly getChannelSettingsUseCase: GetChannelSettingsUseCase,
    private readonly addChannelUseCase: AddChannelUseCase,
    private readonly removeChannelUseCase: RemoveChannelUseCase,
  ) {}

  async handleInteraction(
    interaction: ButtonInteraction | ChannelSelectMenuInteraction | StringSelectMenuInteraction,
  ): Promise<void> {
    // Validate guild context
    if (!interaction.guildId) {
      await interaction.reply({ content: '❌ This can only be used in a server.', ephemeral: true });
      return;
    }

    // Validate permissions
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ content: '❌ You need Administrator permissions to use this.', ephemeral: true });
      return;
    }

    try {
      const customId = interaction.customId;

      if (customId === 'settings:channels:show_add') {
        await this.handleShowAddDropdown(interaction as ButtonInteraction);
      } else if (customId === 'settings:channels:show_remove') {
        await this.handleShowRemoveDropdown(interaction as ButtonInteraction);
      } else if (customId === 'settings:channels:add') {
        await this.handleAddChannel(interaction as ChannelSelectMenuInteraction);
      } else if (customId === 'settings:channels:remove') {
        await this.handleRemoveChannel(interaction as StringSelectMenuInteraction);
      } else if (customId === 'settings:channels:back') {
        await this.handleBackToChannels(interaction as ButtonInteraction);
      }
    } catch (error) {
      await this.handleError(interaction, error);
    }
  }

  private async handleShowAddDropdown(interaction: ButtonInteraction): Promise<void> {
    await interaction.deferUpdate();
    await this.refreshChannelsList(interaction, true, false);
  }

  private async handleShowRemoveDropdown(interaction: ButtonInteraction): Promise<void> {
    await interaction.deferUpdate();
    await this.refreshChannelsList(interaction, false, true);
  }

  private async handleAddChannel(interaction: ChannelSelectMenuInteraction): Promise<void> {
    const channelId = interaction.values[0];
    await interaction.deferUpdate();

    try {
      if (!interaction.guildId || !interaction.guild) {
        throw new Error('Guild context is required');
      }

      const command = new AddChannelCommand(channelId, interaction.guildId);
      await this.addChannelUseCase.execute(command, interaction.guild);
      await this.refreshChannelsList(interaction);
    } catch (error) {
      await this.handleErrorWithReset(interaction, error);
    }
  }

  private async handleRemoveChannel(interaction: StringSelectMenuInteraction): Promise<void> {
    const channelId = interaction.values[0];
    await interaction.deferUpdate();

    try {
      if (!interaction.guild) {
        throw new Error('Guild context is required');
      }

      const command = new RemoveChannelCommand(channelId);
      await this.removeChannelUseCase.execute(command, interaction.guild);
      await this.refreshChannelsList(interaction);
    } catch (error) {
      await this.handleErrorWithReset(interaction, error);
    }
  }

  private async handleBackToChannels(interaction: ButtonInteraction): Promise<void> {
    await interaction.deferUpdate();
    await this.refreshChannelsList(interaction);
  }

  private async refreshChannelsList(
    interaction: ButtonInteraction | ChannelSelectMenuInteraction | StringSelectMenuInteraction,
    showAddDropdown = false,
    showRemoveDropdown = false,
  ): Promise<void> {
    try {
      if (!interaction.guildId || !interaction.guild) {
        throw new Error('Guild context is required');
      }

      const command = new GetChannelSettingsCommand(interaction.guildId);
      const result = await this.getChannelSettingsUseCase.execute(command, interaction.guild);

      const embed = buildChannelListEmbed(result);

      // Get all guild channels for components
      const guildChannels = Array.from(interaction.guild.channels.cache.values())
        .filter((ch) => ch.type === 0) // GuildText
        .map((ch) => ({ id: ch.id, name: ch.name }));

      const components = buildChannelListComponents(result, guildChannels, showAddDropdown, showRemoveDropdown);

      await interaction.editReply({ embeds: [embed], components });
    } catch (error) {
      await this.handleError(interaction, error);
    }
  }

  private async handleError(
    interaction: ButtonInteraction | ChannelSelectMenuInteraction | StringSelectMenuInteraction,
    error: unknown,
  ): Promise<void> {
    logger.error('Settings channels interaction error', error as Error, {
      customId: interaction.customId,
      guildId: interaction.guildId,
      userId: interaction.user.id,
    });

    let message: string;

    if (error instanceof DomainError) {
      message = error.message;
      logger.debug('Domain error handled', error.toLogContext());
    } else {
      message = '❌ An unexpected error occurred. Please try again later.';
      logger.error('Unexpected error in settings-channels interaction', error as Error);
    }

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ content: message });
      } else {
        await interaction.reply({ content: message, ephemeral: true });
      }
    } catch (replyError) {
      logger.error('Failed to send error reply', replyError as Error);
    }
  }

  /**
   * Handle error and reset to clean channel list view (no dropdowns open)
   */
  private async handleErrorWithReset(
    interaction: ButtonInteraction | ChannelSelectMenuInteraction | StringSelectMenuInteraction,
    error: unknown,
  ): Promise<void> {
    logger.error('Settings channels interaction error', error as Error, {
      customId: interaction.customId,
      guildId: interaction.guildId,
      userId: interaction.user.id,
    });

    let errorMessage: string;

    if (error instanceof DomainError) {
      errorMessage = error.message;
      logger.debug('Domain error handled', error.toLogContext());
    } else {
      errorMessage = '❌ An unexpected error occurred. Please try again later.';
      logger.error('Unexpected error in settings-channels interaction', error as Error);
    }

    try {
      // First, send error message as a separate followup message
      await interaction.followUp({ content: errorMessage, ephemeral: true });

      // Then reset the interface to clean state (no dropdowns)
      await this.refreshChannelsList(interaction, false, false);
    } catch (replyError) {
      logger.error('Failed to send error reply or reset interface', replyError as Error);

      // Fallback: try to just edit the original message with error
      try {
        await interaction.editReply({ content: errorMessage, embeds: [], components: [] });
      } catch (fallbackError) {
        logger.error('Failed to send fallback error message', fallbackError as Error);
      }
    }
  }
}
