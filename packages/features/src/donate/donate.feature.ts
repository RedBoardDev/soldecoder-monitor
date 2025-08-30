import { time } from '@shared';
import {
  Feature,
  type FeatureContext,
  FeatureDecorator,
  RateLimit,
  SlashCommand,
} from '@soldecoder-monitor/features-sdk';
import type { ChatInputCommandInteraction } from 'discord.js';
import { DonateCommandHandler } from './discord/commands/donate.command';

@FeatureDecorator({
  name: 'donate',
  version: '1.0.0',
  description: 'Donation system for bot support',
  category: 'General',
})
export class DonateFeature extends Feature {
  private donateHandler!: DonateCommandHandler;

  get metadata() {
    return {
      name: 'donate',
      version: '1.0.0',
      description: 'Donation system for bot support',
      category: 'General',
    };
  }

  async onLoad(context: FeatureContext): Promise<void> {
    this.setContext(context);

    this.donateHandler = new DonateCommandHandler();

    context.logger.info('Donate feature loaded successfully');
  }

  @SlashCommand({
    name: 'donate',
    description: 'Support the bot development and server costs',
    docs: {
      category: 'General',
      description: 'Shows donation information to support the bot',
      usage: '/donate',
      examples: ['/donate'],
      guildOnly: false,
    },
  })
  @RateLimit({
    max: 1,
    window: time.seconds(5),
    scope: 'user',
    message: '⏱️ Please wait {timeRemaining} before using this command again.',
  })
  async handleDonate(interaction: ChatInputCommandInteraction): Promise<void> {
    return this.donateHandler.execute(interaction);
  }
}
