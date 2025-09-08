import type { PermissionValidatorService } from '@soldecoder-monitor/discord';
import { BaseInteractionHandler } from '@soldecoder-monitor/features-sdk';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { ButtonInteraction, ChannelSelectMenuInteraction } from 'discord.js';
import type { GetServerSettingsUseCase, UpdateServerSettingsUseCase } from '../../core/application';
import { GetServerSettingsCommand } from '../../core/application/commands/get-server-settings.command';
import { UpdateServerSettingsCommand } from '../../core/application/commands/update-server-settings.command';
import { buildChannelSelectComponent } from '../ui/channel-select.component';
import { buildServerSettingsEmbed } from '../ui/server-settings.embed';
import { buildServerSettingsComponents } from '../ui/server-settings-components.builder';

export class ChannelInteractionHandler extends BaseInteractionHandler {
  constructor(
    private readonly getServerSettingsUseCase: GetServerSettingsUseCase,
    private readonly updateServerSettingsUseCase: UpdateServerSettingsUseCase,
    private readonly permissionValidator: PermissionValidatorService,
  ) {
    super(createFeatureLogger('settings-server-channel'));
  }

  async handleChannelSelect(interaction: ButtonInteraction): Promise<void> {
    await this.safeDefer(interaction);

    try {
      const channelComponent = buildChannelSelectComponent();

      await this.safeUpdateReply(interaction, {
        content: '📝 Select a channel for summaries and position display:',
        components: [channelComponent],
        embeds: [],
      });
    } catch (error) {
      await this.handleInteractionError(interaction, error, 'Channel select');
    }
  }

  async handleChannelSet(interaction: ChannelSelectMenuInteraction): Promise<void> {
    const selectedChannelId = interaction.values[0];
    await this.safeDefer(interaction);

    try {
      const guild = this.validateGuildContext(interaction);

      await this.permissionValidator.validateChannelAccess(guild, selectedChannelId);

      const updateCommand = new UpdateServerSettingsCommand(guild.id, {
        globalChannelId: selectedChannelId,
      });
      await this.updateServerSettingsUseCase.execute(updateCommand);

      await this.refreshServerSettings(interaction);
    } catch (error) {
      await this.handleErrorWithReset(interaction, error, () => this.refreshServerSettings(interaction));
    }
  }

  private async refreshServerSettings(interaction: ChannelSelectMenuInteraction): Promise<void> {
    const guild = this.validateGuildContext(interaction);
    const getCommand = new GetServerSettingsCommand(guild.id);
    const result = await this.getServerSettingsUseCase.execute(getCommand, guild);

    const embed = buildServerSettingsEmbed(result);
    const components = buildServerSettingsComponents(result.guildSettings);

    await this.safeUpdateReply(interaction, {
      content: '',
      embeds: [embed],
      components,
    });
  }
}
