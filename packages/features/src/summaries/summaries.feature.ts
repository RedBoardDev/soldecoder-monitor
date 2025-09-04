import { DynamoGuildSettingsRepository } from '@soldecoder-monitor/data';
import { Cron, Feature, type FeatureContext, FeatureDecorator } from '@soldecoder-monitor/features-sdk';
import { GetAllGuildConfigsUseCase } from './core/application/use-cases/get-all-guild-configs.use-case';
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

    // Initialize summaries dependencies
    this.getAllGuildConfigsUseCase = new GetAllGuildConfigsUseCase(guildSettingsRepository);
    this.summaryHandler = new SummarySchedulerHandler(this.getAllGuildConfigsUseCase);
  }

  @Cron({
    name: 'weekly-summary-scheduler',
    pattern: '0 0 * * 1', // Every Monday at 00:00 UTC
    timezone: 'UTC',
  })
  async executeWeeklySummary(): Promise<void> {
    try {
      this.context?.logger.info('Starting weekly summary scheduler execution');

      await this.summaryHandler.execute('weekly');

      this.context?.logger.info('Weekly summary scheduler execution completed');
    } catch (error) {
      this.context?.logger.error('Weekly summary scheduler failed', error as Error);
    }
  }

  @Cron({
    name: 'monthly-summary-scheduler',
    pattern: '0 0 1 * *', // Every 1st day of month at 00:00 UTC
    timezone: 'UTC',
  })
  async executeMonthlySummary(): Promise<void> {
    try {
      this.context?.logger.info('Starting monthly summary scheduler execution');

      await this.summaryHandler.execute('monthly');

      this.context?.logger.info('Monthly summary scheduler execution completed');
    } catch (error) {
      this.context?.logger.error('Monthly summary scheduler failed', error as Error);
    }
  }
}
