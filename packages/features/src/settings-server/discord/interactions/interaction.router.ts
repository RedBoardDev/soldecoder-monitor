import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { ButtonInteraction, ChannelSelectMenuInteraction, ModalSubmitInteraction } from 'discord.js';
import { PermissionFlagsBits } from 'discord.js';
import type { ChannelInteractionHandler } from './channel.interaction-handler';
import type { PositionDefaultsInteractionHandler } from './position-defaults.interaction-handler';
import type { ToggleInteractionHandler } from './toggle.interaction-handler';

const logger = createFeatureLogger('settings-server-router');

/**
 * Settings Server Interaction Router
 * Routes interactions to appropriate specialized handlers
 */
export class SettingsServerInteractionRouter {
  constructor(
    private readonly toggleHandler: ToggleInteractionHandler,
    private readonly channelHandler: ChannelInteractionHandler,
    private readonly positionDefaultsHandler: PositionDefaultsInteractionHandler,
  ) {}

  async routeInteraction(
    interaction: ButtonInteraction | ChannelSelectMenuInteraction | ModalSubmitInteraction,
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
      if (this.isToggleInteraction(customId)) {
        await this.toggleHandler.handle(interaction as ButtonInteraction);
      } else if (this.isChannelSelectInteraction(customId)) {
        await this.channelHandler.handleChannelSelect(interaction as ButtonInteraction);
      } else if (this.isChannelSetInteraction(customId)) {
        await this.channelHandler.handleChannelSet(interaction as ChannelSelectMenuInteraction);
      } else if (this.isPositionDefaultsModalInteraction(customId)) {
        await this.positionDefaultsHandler.handleModalOpen(interaction as ButtonInteraction);
      } else if (this.isPositionDefaultsSubmitInteraction(customId)) {
        await this.positionDefaultsHandler.handleModalSubmit(interaction as ModalSubmitInteraction);
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

  private isToggleInteraction(customId: string): boolean {
    return customId.startsWith('settings:server:toggle:');
  }

  private isChannelSelectInteraction(customId: string): boolean {
    return customId === 'settings:server:channel:select';
  }

  private isChannelSetInteraction(customId: string): boolean {
    return customId === 'settings:server:channel:set';
  }

  private isPositionDefaultsModalInteraction(customId: string): boolean {
    return customId === 'settings:server:position-defaults:modal';
  }

  private isPositionDefaultsSubmitInteraction(customId: string): boolean {
    return customId === 'settings:server:position-defaults:submit';
  }
}
