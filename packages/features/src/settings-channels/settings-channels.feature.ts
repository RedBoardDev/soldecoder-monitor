import { time } from '@shared';
import { DynamoChannelConfigRepository } from '@soldecoder-monitor/data';
import { PermissionValidatorService } from '@soldecoder-monitor/discord';
import {
  ButtonHandler,
  Ephemeral,
  Feature,
  type FeatureContext,
  FeatureDecorator,
  RateLimit,
  SelectHandler,
  SlashCommand,
} from '@soldecoder-monitor/features-sdk';
import type {
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  ChatInputCommandInteraction,
  StringSelectMenuInteraction,
} from 'discord.js';
import { AddChannelUseCase, GetChannelSettingsUseCase, RemoveChannelUseCase } from './core/application';
import { SettingsChannelsCommandHandler } from './discord/commands/settings-channels.command';
import { SettingsChannelsInteractionHandler } from './discord/interactions/settings-channels.interaction-handler';

@FeatureDecorator({
  name: 'settings-channels',
  version: '1.0.0',
  description: 'Interactive channel configuration management',
  category: 'Settings',
})
export class SettingsChannelsFeature extends Feature {
  private settingsChannelsHandler!: SettingsChannelsCommandHandler;
  private interactionHandler!: SettingsChannelsInteractionHandler;
  private getChannelSettingsUseCase!: GetChannelSettingsUseCase;
  private addChannelUseCase!: AddChannelUseCase;
  private removeChannelUseCase!: RemoveChannelUseCase;

  get metadata() {
    return {
      name: 'settings-channels',
      version: '1.0.0',
      description: 'Interactive channel configuration management',
      category: 'Settings',
    };
  }

  async onLoad(context: FeatureContext): Promise<void> {
    this.setContext(context);

    // Setup repositories and services
    const channelConfigRepository = DynamoChannelConfigRepository.create();
    const permissionValidator = new PermissionValidatorService();

    // Setup use cases
    this.getChannelSettingsUseCase = new GetChannelSettingsUseCase(channelConfigRepository);
    this.addChannelUseCase = new AddChannelUseCase(channelConfigRepository, permissionValidator);
    this.removeChannelUseCase = new RemoveChannelUseCase(channelConfigRepository);

    // Setup handlers
    this.settingsChannelsHandler = new SettingsChannelsCommandHandler(this.getChannelSettingsUseCase);
    this.interactionHandler = new SettingsChannelsInteractionHandler(
      this.getChannelSettingsUseCase,
      this.addChannelUseCase,
      this.removeChannelUseCase,
    );
  }

  @SlashCommand({
    name: 'settings-channels',
    description: 'Manage channel configuration settings interactively',
    docs: {
      category: 'Settings',
      description: 'Display and configure channel settings with interactive buttons and modals',
      usage: '/settings-channels',
      examples: ['/settings-channels'],
      guildOnly: true,
    },
  })
  @Ephemeral()
  @RateLimit({
    max: 2,
    window: time.minutes(1),
    scope: 'user',
    message: '⏱️ Please wait {timeRemaining} before accessing channel settings again.',
  })
  async handleSettingsChannels(interaction: ChatInputCommandInteraction): Promise<void> {
    return this.settingsChannelsHandler.execute(interaction);
  }

  // Button Interaction Handlers
  @ButtonHandler('settings:channels:show_add')
  async handleShowAddButton(interaction: ButtonInteraction): Promise<void> {
    return this.interactionHandler.handleInteraction(interaction);
  }

  @ButtonHandler('settings:channels:show_remove')
  async handleShowRemoveButton(interaction: ButtonInteraction): Promise<void> {
    return this.interactionHandler.handleInteraction(interaction);
  }

  @ButtonHandler('settings:channels:back')
  async handleBackButton(interaction: ButtonInteraction): Promise<void> {
    return this.interactionHandler.handleInteraction(interaction);
  }

  // Select Menu Handlers
  @SelectHandler('settings:channels:add')
  async handleAddChannelSelect(interaction: ChannelSelectMenuInteraction): Promise<void> {
    return this.interactionHandler.handleInteraction(interaction);
  }

  @SelectHandler('settings:channels:remove')
  async handleRemoveChannelSelect(interaction: StringSelectMenuInteraction): Promise<void> {
    return this.interactionHandler.handleInteraction(interaction);
  }
}
