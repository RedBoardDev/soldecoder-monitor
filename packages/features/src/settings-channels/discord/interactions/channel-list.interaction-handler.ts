import { BaseInteractionHandler } from '@soldecoder-monitor/features-sdk';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { ButtonInteraction, ChannelSelectMenuInteraction, StringSelectMenuInteraction } from 'discord.js';
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

export class ChannelListInteractionHandler extends BaseInteractionHandler {
  constructor(
    private readonly getChannelSettingsUseCase: GetChannelSettingsUseCase,
    private readonly addChannelUseCase: AddChannelUseCase,
    private readonly removeChannelUseCase: RemoveChannelUseCase,
  ) {
    super(createFeatureLogger('channel-list-interactions'));
  }

  async handleShowAddDropdown(interaction: ButtonInteraction): Promise<void> {
    await this.safeDefer(interaction);
    await this.refreshChannelsList(interaction, true, false);
  }

  async handleShowRemoveDropdown(interaction: ButtonInteraction): Promise<void> {
    await this.safeDefer(interaction);
    await this.refreshChannelsList(interaction, false, true);
  }

  async handleAddChannel(interaction: ChannelSelectMenuInteraction): Promise<void> {
    const channelId = interaction.values[0];
    await this.safeDefer(interaction);

    try {
      const guild = this.validateGuildContext(interaction);
      const command = new AddChannelCommand(channelId, guild.id);
      await this.addChannelUseCase.execute(command, guild);
      await this.refreshChannelsList(interaction);
    } catch (error) {
      await this.handleErrorWithReset(interaction, error, () => this.refreshChannelsList(interaction));
    }
  }

  async handleRemoveChannel(interaction: StringSelectMenuInteraction): Promise<void> {
    const channelId = interaction.values[0];
    await this.safeDefer(interaction);

    try {
      const guild = this.validateGuildContext(interaction);
      const command = new RemoveChannelCommand(channelId);
      await this.removeChannelUseCase.execute(command, guild);
      await this.refreshChannelsList(interaction);
    } catch (error) {
      await this.handleErrorWithReset(interaction, error, () => this.refreshChannelsList(interaction));
    }
  }

  async handleBackToChannels(interaction: ButtonInteraction): Promise<void> {
    await this.safeDefer(interaction);
    await this.refreshChannelsList(interaction);
  }

  private async refreshChannelsList(
    interaction: ButtonInteraction | ChannelSelectMenuInteraction | StringSelectMenuInteraction,
    showAddDropdown = false,
    showRemoveDropdown = false,
  ): Promise<void> {
    const guild = this.validateGuildContext(interaction);
    const command = new GetChannelSettingsCommand(guild.id);
    const result = await this.getChannelSettingsUseCase.execute(command, guild);

    const embed = buildChannelListEmbed(result);
    const guildChannels = this.getGuildTextChannels(guild);
    const components = buildChannelListComponents(result, guildChannels, showAddDropdown, showRemoveDropdown);

    await this.safeUpdateReply(interaction, { embeds: [embed], components });
  }
}
