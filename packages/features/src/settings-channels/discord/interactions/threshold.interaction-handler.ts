import type { ThresholdType } from '@soldecoder-monitor/data';
import { BaseInteractionHandler } from '@soldecoder-monitor/features-sdk';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { ButtonInteraction, ModalSubmitInteraction } from 'discord.js';
import {
  GetChannelConfigCommand,
  type GetChannelConfigUseCase,
  UpdateChannelConfigCommand,
  type UpdateChannelConfigUseCase,
} from '../../core/application';
import { buildChannelDetailEmbed } from '../ui/channel-detail.embed';
import { buildChannelDetailComponents } from '../ui/channel-detail-components.builder';
import { validateThreshold } from '../ui/threshold.modal';

export class ThresholdInteractionHandler extends BaseInteractionHandler {
  constructor(
    private readonly getChannelConfigUseCase: GetChannelConfigUseCase,
    private readonly updateChannelConfigUseCase: UpdateChannelConfigUseCase,
  ) {
    super(createFeatureLogger('threshold-interactions'));
  }

  async handleThresholdSubmit(interaction: ModalSubmitInteraction): Promise<void> {
    await this.safeDefer(interaction);

    try {
      const channelId = this.extractChannelId(interaction.customId, 3);
      const thresholdInput = interaction.fields.getTextInputValue('threshold_value');
      const guild = this.validateGuildContext(interaction);

      // Validate threshold
      const validation = validateThreshold(thresholdInput);
      if (!validation.isValid) {
        await this.safeFollowUp(interaction, `❌ ${validation.error}`);
        return;
      }

      // Update configuration
      await this.updateChannelConfigUseCase.execute(
        new UpdateChannelConfigCommand(channelId, { threshold: validation.value }),
        guild,
      );

      // Return to channel detail view
      await this.showChannelDetailView(interaction, channelId);
    } catch (error) {
      await this.handleInteractionError(interaction, error, 'Threshold submit');
    }
  }

  async handleQuickThresholdSet(interaction: ButtonInteraction): Promise<void> {
    await this.safeDefer(interaction);

    try {
      const parts = interaction.customId.split(':');
      const thresholdType = parts[3]; // 'tp', 'sl', 'tpsl'
      const channelId = parts[4];
      const guild = this.validateGuildContext(interaction);

      let thresholdValue: ThresholdType;
      switch (thresholdType) {
        case 'tp':
          thresholdValue = 'TP';
          break;
        case 'sl':
          thresholdValue = 'SL';
          break;
        case 'tpsl':
          thresholdValue = 'TP/SL';
          break;
        default:
          throw new Error(`Unknown threshold type: ${thresholdType}`);
      }

      // Update configuration
      await this.updateChannelConfigUseCase.execute(
        new UpdateChannelConfigCommand(channelId, { threshold: thresholdValue }),
        guild,
      );

      // Return to channel detail view
      await this.showChannelDetailViewButton(interaction, channelId);
    } catch (error) {
      await this.handleInteractionError(interaction, error, 'Quick threshold set');
    }
  }

  private async showChannelDetailView(interaction: ModalSubmitInteraction, channelId: string): Promise<void> {
    const guild = this.validateGuildContext(interaction);
    const result = await this.getChannelConfigUseCase.execute(new GetChannelConfigCommand(channelId), guild);

    const tagDisplayName = this.buildMentionFromTag(result.channelConfig.tagType, result.channelConfig.tagId);

    const embed = buildChannelDetailEmbed(result.channelConfig, result.channelName, tagDisplayName);
    const components = buildChannelDetailComponents(result.channelConfig);

    await this.safeUpdateReply(interaction, { embeds: [embed], components });
  }

  private async showChannelDetailViewButton(interaction: ButtonInteraction, channelId: string): Promise<void> {
    const guild = this.validateGuildContext(interaction);
    const result = await this.getChannelConfigUseCase.execute(new GetChannelConfigCommand(channelId), guild);

    const tagDisplayName = this.buildMentionFromTag(result.channelConfig.tagType, result.channelConfig.tagId);

    const embed = buildChannelDetailEmbed(result.channelConfig, result.channelName, tagDisplayName);
    const components = buildChannelDetailComponents(result.channelConfig);

    await this.safeUpdateReply(interaction, { embeds: [embed], components });
  }
}
