import { time } from '@shared';
import { GuildConfigGuard } from '@shared/domain';
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
  UseGuards,
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

    const guildSettingsRepository = DynamoGuildSettingsRepository.create();
    const permissionValidator = new PermissionValidatorService();

    this.getServerSettingsUseCase = new GetServerSettingsUseCase(guildSettingsRepository);
    this.updateServerSettingsUseCase = new UpdateServerSettingsUseCase(guildSettingsRepository);

    this.settingsServerHandler = new SettingsServerCommandHandler(this.getServerSettingsUseCase);

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

    this.interactionRouter = new SettingsServerInteractionRouter(
      toggleHandler,
      channelHandler,
      positionDefaultsHandler,
    );
  }

  @UseGuards(new GuildConfigGuard())
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

  @ButtonHandler(/^toggle:/)
  @ButtonHandler('channel:select')
  @ButtonHandler('position-defaults:modal')
  async handleServerButtons(interaction: ButtonInteraction): Promise<void> {
    return this.interactionRouter.routeInteraction(interaction);
  }

  @SelectHandler('channel:set')
  async handleSelects(interaction: ChannelSelectMenuInteraction): Promise<void> {
    return this.interactionRouter.routeInteraction(interaction);
  }

  @ModalHandler('position-defaults:submit')
  async handlePositionDefaultsModal(interaction: ModalSubmitInteraction): Promise<void> {
    const positionDefaultsHandler = new PositionDefaultsInteractionHandler(
      this.getServerSettingsUseCase,
      this.updateServerSettingsUseCase,
    );
    return positionDefaultsHandler.handleModalSubmit(interaction);
  }
}
