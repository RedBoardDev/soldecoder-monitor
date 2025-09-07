import { time } from '@shared';
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
import { SetupSessionService } from './core';
import { GuideCommandHandler, RegisterInteractionRouter, StartCommandHandler } from './discord';

@FeatureDecorator({
  name: 'register-process',
  version: '1.0.0',
  description: 'First-time server setup and configuration flow',
  category: 'General',
  interactionPrefix: 'register-process:',
})
export class RegisterProcessFeature extends Feature {
  private sessionService!: SetupSessionService;
  private startCommandHandler!: StartCommandHandler;
  private guideCommandHandler!: GuideCommandHandler;
  private interactionRouter!: RegisterInteractionRouter;

  get metadata() {
    return {
      name: 'register-process',
      version: '1.0.0',
      description: 'First-time server setup and configuration flow',
      category: 'General',
      interactionPrefix: 'register-process:',
    };
  }

  async onLoad(context: FeatureContext): Promise<void> {
    this.setContext(context);

    this.sessionService = SetupSessionService.getInstance();
    this.startCommandHandler = new StartCommandHandler(this.sessionService);
    this.guideCommandHandler = new GuideCommandHandler();
    this.interactionRouter = new RegisterInteractionRouter(this.sessionService);
  }

  @SlashCommand({
    name: 'start',
    description: 'Start the server setup process',
    docs: {
      category: 'General',
      description: 'Initialize the bot configuration for your server with a step-by-step setup flow',
      usage: '/start',
      examples: ['/start'],
      guildOnly: true,
    },
  })
  @Ephemeral()
  @RateLimit({
    max: 1,
    window: time.minutes(1),
    scope: 'user',
    message: '⏱️ Please wait {timeRemaining} before starting a new setup process.',
  })
  async handleStart(interaction: ChatInputCommandInteraction): Promise<void> {
    return this.startCommandHandler.execute(interaction);
  }

  @SlashCommand({
    name: 'guide',
    description: 'Display the complete bot guide and feature overview',
    docs: {
      category: 'General',
      description: 'Shows a comprehensive guide covering all bot features, commands, and configuration options',
      usage: '/guide',
      examples: ['/guide'],
      guildOnly: false,
    },
  })
  @RateLimit({
    max: 1,
    window: time.seconds(10),
    scope: 'user',
    message: '⏱️ Please wait {timeRemaining} before using this command again.',
  })
  @Ephemeral()
  async handleGuide(interaction: ChatInputCommandInteraction): Promise<void> {
    return this.guideCommandHandler.execute(interaction);
  }

  @ButtonHandler(/^nav:/) // Navigation buttons (back, cancel)
  @ButtonHandler(/^step2:wallet-modal$/) // Wallet modal open
  @ButtonHandler(/^step2:skip$/) // Skip wallet config
  @ButtonHandler(/^step3:/) // Feature toggles
  @ButtonHandler(/^step4:confirm$/) // Final confirmation
  async handleButtons(interaction: ButtonInteraction): Promise<void> {
    return this.interactionRouter.routeInteraction(interaction);
  }

  @SelectHandler('step1:channel')
  async handleChannelSelect(interaction: ChannelSelectMenuInteraction): Promise<void> {
    return this.interactionRouter.routeInteraction(interaction);
  }

  @ModalHandler('step2:wallet-submit')
  async handleWalletModal(interaction: ModalSubmitInteraction): Promise<void> {
    return this.interactionRouter.routeInteraction(interaction);
  }

  async onUnload(): Promise<void> {
    if (this.sessionService) {
      this.sessionService.cleanup();
    }
  }
}
