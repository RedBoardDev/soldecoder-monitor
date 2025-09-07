import { time } from '@shared';
import { GuildConfigGuard } from '@shared/domain';
import { DynamoChannelConfigRepository } from '@soldecoder-monitor/data';
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
  RoleSelectMenuInteraction,
  StringSelectMenuInteraction,
  UserSelectMenuInteraction,
} from 'discord.js';
import {
  AddChannelUseCase,
  GetChannelConfigUseCase,
  GetChannelSettingsUseCase,
  RemoveChannelUseCase,
  UpdateChannelConfigUseCase,
} from './core/application';
import {
  ChannelDetailInteractionHandler,
  ChannelListInteractionHandler,
  SettingsChannelsCommandHandler,
  SettingsChannelsInteractionRouter,
  TagInteractionHandler,
  ThresholdInteractionHandler,
} from './discord';

@FeatureDecorator({
  name: 'settings-channels',
  version: '1.0.0',
  description: 'Interactive channel configuration management',
  category: 'Settings',
  interactionPrefix: 'settings-channels:',
})
export class SettingsChannelsFeature extends Feature {
  private settingsChannelsHandler!: SettingsChannelsCommandHandler;
  private interactionRouter!: SettingsChannelsInteractionRouter;
  private getChannelSettingsUseCase!: GetChannelSettingsUseCase;
  private getChannelConfigUseCase!: GetChannelConfigUseCase;
  private addChannelUseCase!: AddChannelUseCase;
  private removeChannelUseCase!: RemoveChannelUseCase;
  private updateChannelConfigUseCase!: UpdateChannelConfigUseCase;

  get metadata() {
    return {
      name: 'settings-channels',
      version: '1.0.0',
      description: 'Interactive channel configuration management',
      category: 'Settings',
      interactionPrefix: 'settings-channels:',
    };
  }

  async onLoad(context: FeatureContext): Promise<void> {
    this.setContext(context);

    // Setup repositories and services
    const channelConfigRepository = DynamoChannelConfigRepository.create();
    const permissionValidator = new PermissionValidatorService();

    // Setup use cases
    this.getChannelSettingsUseCase = new GetChannelSettingsUseCase(channelConfigRepository);
    this.getChannelConfigUseCase = new GetChannelConfigUseCase(channelConfigRepository);
    this.addChannelUseCase = new AddChannelUseCase(channelConfigRepository, permissionValidator);
    this.removeChannelUseCase = new RemoveChannelUseCase(channelConfigRepository);
    this.updateChannelConfigUseCase = new UpdateChannelConfigUseCase(channelConfigRepository);

    // Setup handlers
    this.settingsChannelsHandler = new SettingsChannelsCommandHandler(this.getChannelSettingsUseCase);

    // Setup specialized interaction handlers
    const channelListHandler = new ChannelListInteractionHandler(
      this.getChannelSettingsUseCase,
      this.addChannelUseCase,
      this.removeChannelUseCase,
    );

    const channelDetailHandler = new ChannelDetailInteractionHandler(
      this.getChannelConfigUseCase,
      this.updateChannelConfigUseCase,
      permissionValidator,
    );

    const tagHandler = new TagInteractionHandler(
      this.getChannelConfigUseCase,
      this.updateChannelConfigUseCase,
      permissionValidator,
    );

    // Initialize threshold handler
    const thresholdHandler = new ThresholdInteractionHandler(
      this.getChannelConfigUseCase,
      this.updateChannelConfigUseCase,
    );

    this.interactionRouter = new SettingsChannelsInteractionRouter(
      channelListHandler,
      channelDetailHandler,
      thresholdHandler,
      tagHandler,
    );
  }

  @UseGuards(new GuildConfigGuard())
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

  // Modal Handlers (prefix 'settings-channels:' added automatically)
  @ModalHandler(/^threshold:submit:/)
  async handleModals(interaction: ModalSubmitInteraction): Promise<void> {
    return this.interactionRouter.routeInteraction(interaction);
  }

  // Button Handlers (prefix 'settings-channels:' added automatically)
  @ButtonHandler('show_add')
  @ButtonHandler('show_remove')
  @ButtonHandler('back')
  @ButtonHandler(/^config:/)
  @ButtonHandler(/^toggle:/)
  @ButtonHandler(/^threshold:/)
  @ButtonHandler(/^tag:/)
  async handleButtons(interaction: ButtonInteraction): Promise<void> {
    return this.interactionRouter.routeInteraction(interaction);
  }

  // Select Menu Handlers (prefix 'settings-channels:' added automatically)
  @SelectHandler('add')
  @SelectHandler('remove')
  @SelectHandler(/^tag:user:/)
  @SelectHandler(/^tag:role:/)
  async handleSelects(
    interaction:
      | ChannelSelectMenuInteraction
      | StringSelectMenuInteraction
      | UserSelectMenuInteraction
      | RoleSelectMenuInteraction,
  ): Promise<void> {
    return this.interactionRouter.routeInteraction(interaction);
  }
}
