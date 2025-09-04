import { time } from '@shared';
import { DynamoGuildSettingsRepository } from '@soldecoder-monitor/data';
import { PermissionValidatorService } from '@soldecoder-monitor/discord';
import {
  ButtonHandler,
  Ephemeral,
  Feature,
  type FeatureContext,
  FeatureDecorator,
  ModalHandler,
  RateLimit,
  SelectHandler,
  SlashCommand,
} from '@soldecoder-monitor/features-sdk';
import type {
  ButtonInteraction,
  ChannelSelectMenuInteraction,
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
} from 'discord.js';
import { GetServerSettingsUseCase, UpdateServerSettingsUseCase } from './core/application';
import {
  ChannelInteractionHandler,
  PositionDefaultsInteractionHandler,
  SettingsServerCommandHandler,
  SettingsServerInteractionRouter,
  ToggleInteractionHandler,
} from './discord';

@FeatureDecorator({
  name: 'settings-server',
  version: '1.0.0',
  description: 'Interactive server configuration management',
  category: 'Settings',
  interactionPrefix: 'settings-server:',
})
export class SettingsServerFeature extends Feature {
  private settingsServerHandler!: SettingsServerCommandHandler;
  private interactionRouter!: SettingsServerInteractionRouter;
  private getServerSettingsUseCase!: GetServerSettingsUseCase;
  private updateServerSettingsUseCase!: UpdateServerSettingsUseCase;

  get metadata() {
    return {
      name: 'settings-server',
      version: '1.0.0',
      description: 'Interactive server configuration management',
      category: 'Settings',
      interactionPrefix: 'settings-server:',
    };
  }

  async onLoad(context: FeatureContext): Promise<void> {
    this.setContext(context);

    // Setup repositories and services
    const guildSettingsRepository = DynamoGuildSettingsRepository.create();
    const permissionValidator = new PermissionValidatorService();

    // Setup use cases
    this.getServerSettingsUseCase = new GetServerSettingsUseCase(guildSettingsRepository);
    this.updateServerSettingsUseCase = new UpdateServerSettingsUseCase(guildSettingsRepository);

    // Setup main command handler
    this.settingsServerHandler = new SettingsServerCommandHandler(this.getServerSettingsUseCase);

    // Setup specialized interaction handlers
    const toggleHandler = new ToggleInteractionHandler(this.getServerSettingsUseCase, this.updateServerSettingsUseCase);

    const channelHandler = new ChannelInteractionHandler(
      this.getServerSettingsUseCase,
      this.updateServerSettingsUseCase,
      permissionValidator,
    );

    const positionDefaultsHandler = new PositionDefaultsInteractionHandler(
      this.getServerSettingsUseCase,
      this.updateServerSettingsUseCase,
    );

    // Setup interaction router
    this.interactionRouter = new SettingsServerInteractionRouter(
      toggleHandler,
      channelHandler,
      positionDefaultsHandler,
    );
  }

  @SlashCommand({
    name: 'settings-server',
    description: 'Manage server configuration settings interactively',
    docs: {
      category: 'Settings',
      description: 'Display and configure server settings with interactive buttons and modals',
      usage: '/settings-server',
      examples: ['/settings-server'],
      guildOnly: true,
    },
  })
  @Ephemeral()
  @RateLimit({
    max: 2,
    window: time.minutes(1),
    scope: 'user',
    message: '⏱️ Please wait {timeRemaining} before accessing server settings again.',
  })
  async handleSettingsServer(interaction: ChatInputCommandInteraction): Promise<void> {
    return this.settingsServerHandler.execute(interaction);
  }

  // Button Handlers (prefix 'settings-server:' added automatically)
  @ButtonHandler(/^toggle:/)
  @ButtonHandler('channel:select')
  @ButtonHandler('position-defaults:modal')
  async handleServerButtons(interaction: ButtonInteraction): Promise<void> {
    return this.interactionRouter.routeInteraction(interaction);
  }

  // Select Menu Handlers
  @SelectHandler('channel:set')
  async handleSelects(interaction: ChannelSelectMenuInteraction): Promise<void> {
    return this.interactionRouter.routeInteraction(interaction);
  }

  // Modal Handlers - Direct handler method
  @ModalHandler('position-defaults:submit')
  async handlePositionDefaultsModal(interaction: ModalSubmitInteraction): Promise<void> {
    // Create and call the position defaults handler directly
    const positionDefaultsHandler = new PositionDefaultsInteractionHandler(
      this.getServerSettingsUseCase,
      this.updateServerSettingsUseCase,
    );
    return positionDefaultsHandler.handleModalSubmit(interaction);
  }
}
