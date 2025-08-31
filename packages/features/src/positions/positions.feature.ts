import { time } from '@shared';
import { DynamoGuildSettingsRepository } from '@soldecoder-monitor/data';
import {
  Feature,
  type FeatureContext,
  FeatureDecorator,
  RateLimit,
  SlashCommand,
} from '@soldecoder-monitor/features-sdk';
import type { ChatInputCommandInteraction } from 'discord.js';

// Core application imports
import { CalculatePositionRecommendationsUseCase, createMockWalletInfoService } from './core';
// Discord handlers
import { PositionsSizeCommandHandler } from './discord/commands/positions-size.command';

@FeatureDecorator({
  name: 'positions',
  version: '1.0.0',
  description: 'Position tracking and size calculations with intelligent caching',
  category: 'Positions',
})
export class PositionsFeature extends Feature {
  private positionsSizeHandler!: PositionsSizeCommandHandler;
  private calculatePositionRecommendationsUseCase!: CalculatePositionRecommendationsUseCase;

  get metadata() {
    return {
      name: 'positions',
      version: '1.0.0',
      description: 'Position tracking and size calculations with intelligent caching',
      category: 'Positions',
    };
  }

  async onLoad(context: FeatureContext): Promise<void> {
    this.setContext(context);

    // 🏭 Setup repositories and services (shared cache singleton)
    const guildSettingsRepository = DynamoGuildSettingsRepository.create();
    const walletInfoService = createMockWalletInfoService(); // TODO: Use config for production

    // 🎯 Setup use cases (application layer)
    this.calculatePositionRecommendationsUseCase = new CalculatePositionRecommendationsUseCase(
      guildSettingsRepository,
      walletInfoService,
    );

    // 🎮 Setup Discord handlers (with dependency injection)
    this.positionsSizeHandler = new PositionsSizeCommandHandler(this.calculatePositionRecommendationsUseCase);

    context.logger.info('Positions feature loaded with DDD architecture and caching enabled');
  }

  @SlashCommand({
    name: 'positions-size',
    description: 'Get recommended size per position based on wallet net worth',
    docs: {
      category: 'Positions',
      description: 'Get recommended size per position based on wallet net worth',
      usage: '/positions-size',
      examples: ['/nft-price'],
      guildOnly: false,
    },
    builder: (builder) => {
      builder.addStringOption((option) =>
        option.setName('wallet').setDescription('Optional Solana wallet address (override)').setRequired(false),
      );
      builder.addNumberOption((option) =>
        option
          .setName('stoploss')
          .setDescription('Optional stop loss percent (override default)')
          .setMinValue(0)
          .setMaxValue(100)
          .setRequired(false),
      );
      builder.addNumberOption((option) =>
        option
          .setName('current_size')
          .setDescription('Optional current position size to compute Δ%')
          .setMinValue(0.1)
          .setMaxValue(1000)
          .setRequired(false),
      );
      return builder;
    },
  })
  @RateLimit({
    max: 2,
    window: time.minutes(15),
    scope: 'user',
    message: '⏱️ Please wait {timeRemaining} before checking positions size again.',
  })
  async handlePositionsSize(interaction: ChatInputCommandInteraction): Promise<void> {
    return this.positionsSizeHandler.execute(interaction);
  }
}
