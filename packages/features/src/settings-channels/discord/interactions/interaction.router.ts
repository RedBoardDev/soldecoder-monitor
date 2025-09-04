import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type {
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  ModalSubmitInteraction,
  RoleSelectMenuInteraction,
  StringSelectMenuInteraction,
  UserSelectMenuInteraction,
} from 'discord.js';
import { PermissionFlagsBits } from 'discord.js';
import type { ChannelDetailInteractionHandler } from './channel-detail.interaction-handler';
import type { ChannelListInteractionHandler } from './channel-list.interaction-handler';
import type { TagInteractionHandler } from './tag.interaction-handler';
import type { ThresholdInteractionHandler } from './threshold.interaction-handler';

const logger = createFeatureLogger('settings-channels-router');

export class SettingsChannelsInteractionRouter {
  constructor(
    private readonly channelListHandler: ChannelListInteractionHandler,
    private readonly channelDetailHandler: ChannelDetailInteractionHandler,
    private readonly thresholdHandler: ThresholdInteractionHandler,
    private readonly tagHandler: TagInteractionHandler,
  ) {}

  async routeInteraction(
    interaction:
      | ButtonInteraction
      | ChannelSelectMenuInteraction
      | StringSelectMenuInteraction
      | ModalSubmitInteraction
      | UserSelectMenuInteraction
      | RoleSelectMenuInteraction,
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

      // Route to appropriate handler based on custom ID pattern
      if (this.isChannelListInteraction(customId)) {
        await this.routeToChannelListHandler(
          interaction as ButtonInteraction | ChannelSelectMenuInteraction | StringSelectMenuInteraction,
          customId,
        );
      } else if (this.isChannelDetailInteraction(customId)) {
        await this.routeToChannelDetailHandler(interaction as ButtonInteraction, customId);
      } else if (this.isThresholdInteraction(customId)) {
        await this.thresholdHandler.handleThresholdSubmit(interaction as ModalSubmitInteraction);
      } else if (this.isTagInteraction(customId)) {
        await this.routeToTagHandler(interaction as UserSelectMenuInteraction | RoleSelectMenuInteraction, customId);
      } else {
        logger.warn('Unknown interaction custom ID', { customId });
      }
    } catch (error) {
      logger.error('Router error', error as Error, {
        customId: interaction.customId,
        guildId: interaction.guildId,
      });
    }
  }

  private async routeToChannelListHandler(
    interaction: ButtonInteraction | ChannelSelectMenuInteraction | StringSelectMenuInteraction,
    customId: string,
  ): Promise<void> {
    if (customId === 'settings-channels:show_add') {
      await this.channelListHandler.handleShowAddDropdown(interaction as ButtonInteraction);
    } else if (customId === 'settings-channels:show_remove') {
      await this.channelListHandler.handleShowRemoveDropdown(interaction as ButtonInteraction);
    } else if (customId === 'settings-channels:add') {
      await this.channelListHandler.handleAddChannel(interaction as ChannelSelectMenuInteraction);
    } else if (customId === 'settings-channels:remove') {
      await this.channelListHandler.handleRemoveChannel(interaction as StringSelectMenuInteraction);
    } else if (customId === 'settings-channels:back') {
      await this.channelListHandler.handleBackToChannels(interaction as ButtonInteraction);
    }
  }

  private async routeToChannelDetailHandler(interaction: ButtonInteraction, customId: string): Promise<void> {
    if (customId.startsWith('settings-channels:config:')) {
      await this.channelDetailHandler.handleChannelConfig(interaction);
    } else if (customId.startsWith('settings-channels:toggle:')) {
      await this.channelDetailHandler.handleToggle(interaction);
    } else if (customId.startsWith('settings-channels:threshold:')) {
      await this.channelDetailHandler.handleThresholdModal(interaction);
    } else if (customId.startsWith('settings-channels:tag:')) {
      await this.channelDetailHandler.handleTagAction(interaction);
    }
  }

  private async routeToTagHandler(
    interaction: UserSelectMenuInteraction | RoleSelectMenuInteraction,
    customId: string,
  ): Promise<void> {
    if (customId.startsWith('settings-channels:tag:user:')) {
      await this.tagHandler.handleUserTagSelect(interaction as UserSelectMenuInteraction);
    } else if (customId.startsWith('settings-channels:tag:role:')) {
      await this.tagHandler.handleRoleTagSelect(interaction as RoleSelectMenuInteraction);
    }
  }

  private isChannelListInteraction(customId: string): boolean {
    return (
      customId === 'settings-channels:back' ||
      customId === 'settings-channels:show_add' ||
      customId === 'settings-channels:show_remove' ||
      customId === 'settings-channels:add' ||
      customId === 'settings-channels:remove'
    );
  }

  private isChannelDetailInteraction(customId: string): boolean {
    return (
      customId.startsWith('settings-channels:config:') ||
      customId.startsWith('settings-channels:toggle:') ||
      (customId.startsWith('settings-channels:threshold:') && !customId.includes(':submit:')) ||
      (customId.startsWith('settings-channels:tag:') && !customId.includes(':user:') && !customId.includes(':role:'))
    );
  }

  private isThresholdInteraction(customId: string): boolean {
    return customId.startsWith('settings-channels:threshold:submit:');
  }

  private isTagInteraction(customId: string): boolean {
    return customId.startsWith('settings-channels:tag:user:') || customId.startsWith('settings-channels:tag:role:');
  }
}
