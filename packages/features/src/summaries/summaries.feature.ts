import { LpAgentAdapter } from '@shared/infrastructure/lpagent.adapter';
import { DynamoGuildSettingsRepository } from '@soldecoder-monitor/data';
import { Cron, Feature, type FeatureContext, FeatureDecorator } from '@soldecoder-monitor/features-sdk';
import { GetAllGuildConfigsUseCase } from './core/application/use-cases/get-all-guild-configs.use-case';
import { SummaryContextVO } from './core/domain/value-objects/summary-context.vo';
import { SummarySchedulerHandler } from './discord/handlers/summary-scheduler.handler';

@FeatureDecorator({
  name: 'summaries',
  version: '1.0.0',
  description: 'Weekly and monthly summary features',
  category: 'Summaries',
})
export class SummariesFeature extends Feature {
  private summaryHandler!: SummarySchedulerHandler;
  private getAllGuildConfigsUseCase!: GetAllGuildConfigsUseCase;

  get metadata() {
    return {
      name: 'summaries',
      version: '1.0.0',
      description: 'Weekly and monthly summary features',
      category: 'Summaries',
    };
  }

  async onLoad(context: FeatureContext): Promise<void> {
    this.setContext(context);

    const guildSettingsRepository = DynamoGuildSettingsRepository.create();
    const lpAgentAdapter = LpAgentAdapter.getInstance();

    this.getAllGuildConfigsUseCase = new GetAllGuildConfigsUseCase(guildSettingsRepository);

    this.summaryHandler = new SummarySchedulerHandler(this.getAllGuildConfigsUseCase, lpAgentAdapter);
  }

  @Cron({
    name: 'weekly-summary-scheduler',
    pattern: '0 0 * * 1', // Every Monday at 00:00 UTC
    timezone: 'UTC',
  })
  async executeWeeklySummary(): Promise<void> {
    const context = SummaryContextVO.create('weekly');
    await this.executeScheduledSummary(context);
  }

  @Cron({
    name: 'monthly-summary-scheduler',
    pattern: '0 0 1 * *', // Every 1st day of month at 00:00 UTC
    timezone: 'UTC',
  })
  async executeMonthlySummary(): Promise<void> {
    const context = SummaryContextVO.create('monthly');
    await this.executeScheduledSummary(context);
  }

  /**
   * Execute scheduled summary with proper context
   */
  private async executeScheduledSummary(context: SummaryContextVO): Promise<void> {
    try {
      this.context?.logger.info(`Starting ${context.typeLabel.toLowerCase()} summary scheduler execution`);

      await this.summaryHandler.execute(context);

      this.context?.logger.info(`${context.typeLabel} summary scheduler execution completed`);
    } catch (error) {
      this.context?.logger.error(`${context.typeLabel} summary scheduler failed`, error as Error);
    }
  }
}
