import type { PermissionValidatorService } from '@soldecoder-monitor/discord';
import { BaseInteractionHandler } from '@soldecoder-monitor/features-sdk';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { RoleSelectMenuInteraction, UserSelectMenuInteraction } from 'discord.js';
import {
  GetChannelConfigCommand,
  type GetChannelConfigUseCase,
  UpdateChannelConfigCommand,
  type UpdateChannelConfigUseCase,
} from '../../core/application';
import { buildChannelDetailEmbed } from '../ui/channel-detail.embed';
import { buildChannelDetailComponents } from '../ui/channel-detail-components.builder';

export class TagInteractionHandler extends BaseInteractionHandler {
  constructor(
    private readonly getChannelConfigUseCase: GetChannelConfigUseCase,
    private readonly updateChannelConfigUseCase: UpdateChannelConfigUseCase,
    private readonly permissionValidator: PermissionValidatorService,
  ) {
    super(createFeatureLogger('tag-interactions'));
  }

  async handleUserTagSelect(interaction: UserSelectMenuInteraction): Promise<void> {
    await this.safeDefer(interaction);

    try {
      const channelId = this.extractChannelId(interaction.customId, 3);
      const selectedUserId = interaction.values[0];

      if (!selectedUserId) {
        throw new Error('No user selected');
      }

      const guild = this.validateGuildContext(interaction);

      // Validate permissions
      await this.permissionValidator.validateMentionFeature(guild, channelId, 'USER');

      // Update configuration
      await this.updateChannelConfigUseCase.execute(
        new UpdateChannelConfigCommand(channelId, { tagType: 'user', tagId: selectedUserId }),
        guild,
      );

      // Return to channel detail view
      await this.showChannelDetailView(interaction, channelId);
    } catch (error) {
      await this.handleInteractionError(interaction, error, 'User tag select');
    }
  }

  async handleRoleTagSelect(interaction: RoleSelectMenuInteraction): Promise<void> {
    await this.safeDefer(interaction);

    try {
      const channelId = this.extractChannelId(interaction.customId, 3);
      const selectedRoleId = interaction.values[0];

      if (!selectedRoleId) {
        throw new Error('No role selected');
      }

      const guild = this.validateGuildContext(interaction);

      // Validate permissions
      await this.permissionValidator.validateMentionFeature(guild, channelId, 'ROLE');

      // Update configuration
      await this.updateChannelConfigUseCase.execute(
        new UpdateChannelConfigCommand(channelId, { tagType: 'role', tagId: selectedRoleId }),
        guild,
      );

      // Return to channel detail view
      await this.showChannelDetailView(interaction, channelId);
    } catch (error) {
      await this.handleInteractionError(interaction, error, 'User tag select');
    }
  }

  private async showChannelDetailView(
    interaction: UserSelectMenuInteraction | RoleSelectMenuInteraction,
    channelId: string,
  ): Promise<void> {
    const guild = this.validateGuildContext(interaction);
    const result = await this.getChannelConfigUseCase.execute(new GetChannelConfigCommand(channelId), guild);

    const tagDisplayName = this.buildMentionFromTag(result.channelConfig.tagType, result.channelConfig.tagId);

    const embed = buildChannelDetailEmbed(result.channelConfig, result.channelName, tagDisplayName);
    const components = buildChannelDetailComponents(result.channelConfig);

    await this.safeUpdateReply(interaction, { embeds: [embed], components });
  }
}
