import { time } from '@shared';
import { GuildConfigGuard } from '@shared/domain';
import { PortfolioService } from '@shared/infrastructure/portfolio.service';
import { DynamoGuildSettingsRepository } from '@soldecoder-monitor/data';
import {
  Ephemeral,
  Feature,
  type FeatureContext,
  FeatureDecorator,
  RateLimit,
  SlashCommand,
  UseGuards,
} from '@soldecoder-monitor/features-sdk';
import type { ChatInputCommandInteraction } from 'discord.js';
import { CalculatePositionSizesUseCase } from './core/application/use-cases/calculate-position-sizes.use-case';
import { PositionSizeCommandHandler } from './discord/commands/position-size.command';

@FeatureDecorator({
  name: 'position-size',
  version: '1.0.0',
  description: 'Position size calculations with intelligent recommendations',
  category: 'Positions',
})
export class PositionSizeFeature extends Feature {
  private positionSizeHandler!: PositionSizeCommandHandler;
  private calculatePositionSizesUseCase!: CalculatePositionSizesUseCase;

  get metadata() {
    return {
      name: 'position-size',
      version: '1.0.0',
      description: 'Position size calculations with intelligent recommendations',
      category: 'Positions',
    };
  }

  async onLoad(context: FeatureContext): Promise<void> {
    this.setContext(context);

    const guildSettingsRepository = DynamoGuildSettingsRepository.create();
    const portfolioService = PortfolioService.getInstance();

    this.calculatePositionSizesUseCase = new CalculatePositionSizesUseCase(guildSettingsRepository, portfolioService);

    this.positionSizeHandler = new PositionSizeCommandHandler(this.calculatePositionSizesUseCase);
  }

  @UseGuards(new GuildConfigGuard())
  @SlashCommand({
    name: 'position-size',
    description: 'Get recommended size per position based on wallet net worth',
    docs: {
      category: 'Positions',
      description: 'Shows recommended position sizes for 1-6 positions based on wallet net worth',
      usage: '/position-size [wallet] [stoploss] [current_size]',
      examples: [
        '/position-size',
        '/position-size wallet:ABC...123',
        '/position-size stoploss:5',
        '/position-size wallet:ABC...123 stoploss:5 current_size:10',
      ],
      guildOnly: false,
    },
    builder: (builder) => {
      builder.addStringOption((option) =>
        option.setName('wallet').setDescription('Optional Solana wallet address (override default)').setRequired(false),
      );
      builder.addNumberOption((option) =>
        option
          .setName('stoploss')
          .setDescription('Optional stop loss percent (override default)')
          .setMinValue(0.1)
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
  @Ephemeral()
  @RateLimit({
    max: 200,
    window: time.minutes(5),
    scope: 'user',
    message: '⏱️ Please wait {timeRemaining} before checking position sizes again.',
  })
  async handlePositionSize(interaction: ChatInputCommandInteraction): Promise<void> {
    return this.positionSizeHandler.execute(interaction);
  }
}
