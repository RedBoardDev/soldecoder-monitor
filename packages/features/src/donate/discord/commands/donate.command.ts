import { buildDonateEmbed } from '@shared/discord/ui/donate.embed';
import type { ChatInputCommandInteraction } from 'discord.js';

/**
 * Donate command handler - Pure implementation without decorators
 *
 * Displays donation information to support the bot development
 * Decorators are on the main Feature class, this is just the implementation
 */
export class DonateCommandHandler {
  /**
   * Execute the donate command
   */
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      const donateEmbed = buildDonateEmbed();

      await interaction.reply({
        embeds: [donateEmbed],
        ephemeral: false,
      });
    } catch (error) {
      await this.handleError(interaction, error);
    }
  }

  /**
   * Handle command errors gracefully
   */
  private async handleError(interaction: ChatInputCommandInteraction, _error: unknown): Promise<void> {
    const content = '❌ An error occurred while processing the donation command. Please try again.';

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ content });
      } else {
        await interaction.reply({ content, ephemeral: true });
      }
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
}
