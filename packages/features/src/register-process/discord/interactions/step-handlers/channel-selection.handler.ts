import { PermissionValidatorService } from '@soldecoder-monitor/discord';
import { type ChannelSelectMenuInteraction, ChannelType } from 'discord.js';
import { type SetupSession, type SetupSessionService, SetupStep } from '../../../core';
import { buildStep2Components, buildStep2Embed } from '../../ui/steps';

export class ChannelSelectionHandler {
  private readonly permissionValidator: PermissionValidatorService;

  constructor(private readonly sessionService: SetupSessionService) {
    this.permissionValidator = new PermissionValidatorService();
  }

  async handle(interaction: ChannelSelectMenuInteraction, session: SetupSession): Promise<void> {
    const selectedChannelId = interaction.values[0];

    const channel = interaction.guild?.channels.cache.get(selectedChannelId);
    if (!channel || channel.type !== ChannelType.GuildText) {
      await interaction.followUp({
        content: '❌ Please select a valid text channel.',
        ephemeral: true,
      });
      return;
    }

    try {
      if (interaction.guild) {
        await this.permissionValidator.validateChannelAccess(interaction.guild, selectedChannelId);
      }
    } catch (error) {
      await interaction.followUp({
        content: `❌ ${(error as Error).message}`,
        ephemeral: true,
      });
      return;
    }

    const updatedSession = this.sessionService.updateData(session.guildId, session.userId, {
      globalChannelId: selectedChannelId,
    });
    this.sessionService.updateStep(session.guildId, session.userId, SetupStep.WALLET_CONFIG);

    const embed = buildStep2Embed(updatedSession);
    const components = buildStep2Components(false);

    await interaction.editReply({
      embeds: [embed],
      components,
    });
  }
}
