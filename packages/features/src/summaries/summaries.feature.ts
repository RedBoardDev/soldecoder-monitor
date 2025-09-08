import { LpAgentAdapter } from '@shared/infrastructure/lpagent.adapter';
import { PortfolioService } from '@shared/infrastructure/portfolio.service';
import { DynamoGuildSettingsRepository } from '@soldecoder-monitor/data';
import { Cron, Feature, type FeatureContext, FeatureDecorator, SlashCommand } from '@soldecoder-monitor/features-sdk';
import type { ChatInputCommandInteraction } from 'discord.js';
import { GetAllGuildConfigsUseCase } from './core/application/use-cases/get-all-guild-configs.use-case';
import { ProcessSummaryUseCase } from './core/application/use-cases/process-summary.use-case';
import { SendSummaryNotificationUseCase } from './core/application/use-cases/send-summary-notification.use-case';
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
    const portfolioService = PortfolioService.getInstance();

    const getAllGuildConfigsUseCase = new GetAllGuildConfigsUseCase(guildSettingsRepository);
    const processSummaryUseCase = new ProcessSummaryUseCase(
      getAllGuildConfigsUseCase,
      lpAgentAdapter,
      portfolioService,
    );
    const sendNotificationUseCase = new SendSummaryNotificationUseCase(context);

    this.summaryHandler = new SummarySchedulerHandler(processSummaryUseCase, sendNotificationUseCase);
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

  @SlashCommand({
    name: 'weekly',
    description: 'Test weekly summary processing',
  })
  async handleWeeklyCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    try {
      const context = SummaryContextVO.create('weekly');
      await this.summaryHandler.execute(context);

      await interaction.editReply('✅ Weekly summary test completed');
    } catch (error) {
      await interaction.editReply('❌ Weekly summary test failed');
      throw error;
    }
  }

  @SlashCommand({
    name: 'monthly',
    description: 'Test monthly summary processing',
  })
  async handleMonthlyCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    try {
      const context = SummaryContextVO.create('monthly');
      await this.summaryHandler.execute(context);

      await interaction.editReply('✅ Monthly summary test completed');
    } catch (error) {
      await interaction.editReply('❌ Monthly summary test failed');
      throw error;
    }
  }

  private async executeScheduledSummary(context: SummaryContextVO): Promise<void> {
    try {
      await this.summaryHandler.execute(context);
    } catch (error) {
      this.context?.logger.error(`${context.typeLabel} summary scheduler failed`, error as Error);
    }
  }
}
