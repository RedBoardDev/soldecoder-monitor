import { BaseInteractionHandler } from '@soldecoder-monitor/features-sdk';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { ModalSubmitInteraction } from 'discord.js';
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

  private async showChannelDetailView(interaction: ModalSubmitInteraction, channelId: string): Promise<void> {
    const guild = this.validateGuildContext(interaction);
    const result = await this.getChannelConfigUseCase.execute(new GetChannelConfigCommand(channelId), guild);

    const tagDisplayName = this.buildMentionFromTag(result.channelConfig.tagType, result.channelConfig.tagId);

    const embed = buildChannelDetailEmbed(result.channelConfig, result.channelName, tagDisplayName);
    const components = buildChannelDetailComponents(result.channelConfig);

    await this.safeUpdateReply(interaction, { embeds: [embed], components });
  }
}
