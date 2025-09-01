import { time } from '@shared';
import { DynamoChannelConfigRepository, DynamoGuildSettingsRepository } from '@soldecoder-monitor/data';
import {
  Ephemeral,
  Feature,
  type FeatureContext,
  FeatureDecorator,
  Interval,
  RateLimit,
  SlashCommand,
} from '@soldecoder-monitor/features-sdk';
import type { ChatInputCommandInteraction } from 'discord.js';
import { GetGlobalPositionsUseCase } from './core/application/use-cases/get-global-positions.use-case';
import { UpdateGlobalPositionsSchedulerUseCase } from './core/application/use-cases/update-global-positions-scheduler.use-case';
import { GlobalMessageUpdateService } from './core/infrastructure/services/global-message-update.service';
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
  private updateSchedulerUseCase!: UpdateGlobalPositionsSchedulerUseCase;

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
    const channelConfigRepository = DynamoChannelConfigRepository.create();
    const globalMessageService = GlobalMessageUpdateService.create();

    this.getGlobalPositionsUseCase = new GetGlobalPositionsUseCase(guildSettingsRepository);
    this.updateSchedulerUseCase = new UpdateGlobalPositionsSchedulerUseCase(
      guildSettingsRepository,
      channelConfigRepository,
      globalMessageService,
    );

    this.globalPositionsHandler = new GlobalPositionsCommandHandler(this.getGlobalPositionsUseCase);

    context.logger.info('Global positions feature loaded with scheduler');
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

  @Interval({
    name: 'global-positions-auto-update',
    milliseconds: 30000, // Every 30 seconds
    runOnInit: false, // Start 30s after initialization
  })
  async updateGlobalPositions(): Promise<void> {
    if (!this.context?.client) {
      this.context?.logger.warn('Client not available for global positions update');
      return;
    }

    try {
      await this.updateSchedulerUseCase.execute(this.context.client);
    } catch (error) {
      this.context?.logger.error('Global positions scheduler failed', error as Error);
    }
  }
}
