import type { ChatInputCommandInteraction } from 'discord.js';
import { buildStep5Embed } from '../ui/steps';

export class GuideCommandHandler {
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const embed = buildStep5Embed();

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  }
}
