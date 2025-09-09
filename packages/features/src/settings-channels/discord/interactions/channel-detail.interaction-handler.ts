import type { ChannelConfigEntity } from '@soldecoder-monitor/data';
import type { PermissionValidatorService } from '@soldecoder-monitor/discord';
import { BaseInteractionHandler } from '@soldecoder-monitor/features-sdk';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { ButtonInteraction, Guild } from 'discord.js';
import {
  type ChannelConfigUpdates,
  GetChannelConfigCommand,
  type GetChannelConfigUseCase,
  UpdateChannelConfigCommand,
  type UpdateChannelConfigUseCase,
} from '../../core/application';
import { buildChannelDetailEmbed } from '../ui/channel-detail.embed';
import { buildChannelDetailComponents } from '../ui/channel-detail-components.builder';
import { buildRoleSelectComponent, buildUserSelectComponent } from '../ui/tag-select.components';
import { buildThresholdModal } from '../ui/threshold.modal';

export class ChannelDetailInteractionHandler extends BaseInteractionHandler {
  constructor(
    private readonly getChannelConfigUseCase: GetChannelConfigUseCase,
    private readonly updateChannelConfigUseCase: UpdateChannelConfigUseCase,
    private readonly permissionValidator: PermissionValidatorService,
  ) {
    super(createFeatureLogger('channel-detail-interactions'));
  }

  async handleChannelConfig(interaction: ButtonInteraction): Promise<void> {
    await this.safeDefer(interaction);

    try {
      const channelId = this.extractChannelId(interaction.customId, 2);
      await this.showChannelDetailView(interaction, channelId);
    } catch (error) {
      await this.handleInteractionError(interaction, error, 'Channel config');
    }
  }

  async handleToggle(interaction: ButtonInteraction): Promise<void> {
    await this.safeDefer(interaction);

    try {
      const { setting, channelId } = this.parseStructuredCustomId(
        interaction.customId,
        (parts) => {
          if (parts.length < 4) throw new Error('Expected 4 parts');
          return { setting: parts[2], channelId: parts[3] };
        },
        'Invalid toggle custom ID format',
      );

      const guild = this.validateGuildContext(interaction);

      // Get current config
      const configResult = await this.getChannelConfigUseCase.execute(new GetChannelConfigCommand(channelId), guild);
      const currentConfig = configResult.channelConfig;

      // Validate permissions before enabling
      await this.validateFeaturePermissions(setting, currentConfig, guild, channelId);

      // Apply toggle
      const updates = this.buildToggleUpdates(setting, currentConfig);
      await this.updateChannelConfigUseCase.execute(new UpdateChannelConfigCommand(channelId, updates), guild);

      // Refresh view
      await this.showChannelDetailView(interaction, channelId);
    } catch (error) {
      await this.handleInteractionError(interaction, error, 'Toggle setting');
    }
  }

  async handleThresholdModal(interaction: ButtonInteraction): Promise<void> {
    try {
      const channelId = this.extractChannelId(interaction.customId, 2);
      const guild = this.validateGuildContext(interaction);

      const result = await this.getChannelConfigUseCase.execute(new GetChannelConfigCommand(channelId), guild);

      const modal = buildThresholdModal(channelId, result.channelConfig.threshold);
      await interaction.showModal(modal);
    } catch (error) {
      await this.handleInteractionError(interaction, error, 'Threshold modal');
    }
  }

  async handleTagAction(interaction: ButtonInteraction): Promise<void> {
    await this.safeDefer(interaction);

    try {
      const { action, channelId } = this.parseStructuredCustomId(
        interaction.customId,
        (parts) => {
          if (parts.length < 4) throw new Error('Expected 4 parts');
          return { action: parts[2], channelId: parts[3] };
        },
        'Invalid tag action custom ID format',
      );

      const guild = this.validateGuildContext(interaction);

      if (action === 'clear') {
        await this.updateChannelConfigUseCase.execute(
          new UpdateChannelConfigCommand(channelId, { tagType: null, tagId: null }),
          guild,
        );
        await this.showChannelDetailView(interaction, channelId);
      } else if (action === 'select_user') {
        const component = buildUserSelectComponent(channelId);
        await this.safeUpdateReply(interaction, {
          content: '👤 Select a user to tag when notifications are sent:',
          components: [component],
          embeds: [],
        });
      } else if (action === 'select_role') {
        const component = buildRoleSelectComponent(channelId);
        await this.safeUpdateReply(interaction, {
          content: '👥 Select a role to tag when notifications are sent:',
          components: [component],
          embeds: [],
        });
      }
    } catch (error) {
      await this.handleInteractionError(interaction, error, 'Tag action');
    }
  }

  async showChannelDetailView(interaction: ButtonInteraction, channelId: string): Promise<void> {
    const guild = this.validateGuildContext(interaction);

    const result = await this.getChannelConfigUseCase.execute(new GetChannelConfigCommand(channelId), guild);

    // Build tag display
    let tagDisplayName: string | undefined;
    if (result.channelConfig.tagType && result.channelConfig.tagId) {
      tagDisplayName =
        result.channelConfig.tagType === 'role'
          ? `<@&${result.channelConfig.tagId}>`
          : `<@${result.channelConfig.tagId}>`;
    }

    const embed = buildChannelDetailEmbed(result.channelConfig, result.channelName, tagDisplayName);
    const components = buildChannelDetailComponents(result.channelConfig);

    await this.safeUpdateReply(interaction, { embeds: [embed], components });
  }

  private async validateFeaturePermissions(
    setting: string,
    currentConfig: ChannelConfigEntity,
    guild: Guild,
    channelId: string,
  ): Promise<void> {
    if (setting === 'image' && !currentConfig.image) {
      await this.permissionValidator.validateImageFeature(guild, channelId);
    } else if (setting === 'pin' && !currentConfig.pin) {
      await this.permissionValidator.validatePinFeature(guild, channelId);
    }
  }

  private buildToggleUpdates(setting: string, currentConfig: ChannelConfigEntity): ChannelConfigUpdates {
    switch (setting) {
      case 'image':
        return { image: !currentConfig.image };
      case 'pin':
        return { pin: !currentConfig.pin };
      default:
        throw new Error(`Unknown toggle setting: ${setting}`);
    }
  }
}
