import { time } from '@shared';
import { DynamoGuildSettingsRepository } from '@soldecoder-monitor/data';
import {
  Ephemeral,
  Feature,
  type FeatureContext,
  FeatureDecorator,
  RateLimit,
  SlashCommand,
} from '@soldecoder-monitor/features-sdk';
import type { ChatInputCommandInteraction } from 'discord.js';
import { GetGlobalPositionsUseCase } from './core/application/use-cases/get-global-positions.use-case';
import { GlobalPositionsCommandHandler } from './discord/commands/global-positions.command';

@FeatureDecorator({
  name: 'global-positions',
  version: '1.0.0',
  description: 'Show global positions overview',
  category: 'Positions',
})
export class GlobalPositionsFeature extends Feature {
  private globalPositionsHandler!: GlobalPositionsCommandHandler;
  private getGlobalPositionsUseCase!: GetGlobalPositionsUseCase;

  get metadata() {
    return {
      name: 'global-positions',
      version: '1.0.0',
      description: 'Show global positions overview',
      category: 'Positions',
    };
  }

  async onLoad(context: FeatureContext): Promise<void> {
    this.setContext(context);

    const guildSettingsRepository = DynamoGuildSettingsRepository.create();

    this.getGlobalPositionsUseCase = new GetGlobalPositionsUseCase(guildSettingsRepository);

    this.globalPositionsHandler = new GlobalPositionsCommandHandler(this.getGlobalPositionsUseCase);
  }

  @SlashCommand({
    name: 'global-positions',
    description: 'Display all positions from the configured wallet',
    docs: {
      category: 'Positions',
      description: 'Shows an overview of all positions from the configured channels with current values and PnL',
      usage: '/global-positions [percent_only]',
      examples: ['/global-positions', '/global-positions percent_only:true'],
      guildOnly: false,
    },
    builder: (builder) => {
      builder.addBooleanOption((option) =>
        option
          .setName('percent_only')
          .setDescription('Show only percentages without amounts (true/false)')
          .setRequired(false),
      );
      return builder;
    },
  })
  @Ephemeral()
  @RateLimit({
    max: 3,
    window: time.minutes(5),
    scope: 'user',
    message: '⏱️ Please wait {timeRemaining} before checking global positions again.',
  })
  async handleGlobalPositions(interaction: ChatInputCommandInteraction): Promise<void> {
    return this.globalPositionsHandler.execute(interaction);
  }
}
