import { LpAgentAdapter } from '@shared/infrastructure/lpagent.adapter';
import { DynamoChannelConfigRepository, DynamoGuildSettingsRepository } from '@soldecoder-monitor/data';
import { Feature, type FeatureContext, FeatureDecorator, On } from '@soldecoder-monitor/features-sdk';
import type { Message } from 'discord.js';
import { ProcessClosedMessageUseCase } from './core/application/use-cases/process-closed-message.use-case';
import { SendClosedNotificationUseCase } from './core/application/use-cases/send-closed-notification.use-case';
import { ClosedMessageHandler } from './discord/handlers/closed-message.handler';

@FeatureDecorator({
  name: 'closed-messages',
  version: '1.0.0',
  description: 'Process and handle closed position messages from Discord',
  category: 'Closed Messages',
})
export class ClosedMessagesFeature extends Feature {
  private closedMessageHandler!: ClosedMessageHandler;

  get metadata() {
    return {
      name: 'closed-messages',
      version: '1.0.0',
      description: 'Process and handle closed position messages from Discord',
      category: 'Closed Messages',
    };
  }

  async onLoad(context: FeatureContext): Promise<void> {
    this.setContext(context);

    const channelConfigRepo = DynamoChannelConfigRepository.create();
    const guildConfigRepo = DynamoGuildSettingsRepository.create();
    const lpAgentService = LpAgentAdapter.getInstance();

    const processClosedMessageUseCase = new ProcessClosedMessageUseCase(
      channelConfigRepo,
      guildConfigRepo,
      lpAgentService,
    );
    const sendNotificationUseCase = new SendClosedNotificationUseCase(guildConfigRepo);

    this.closedMessageHandler = new ClosedMessageHandler(processClosedMessageUseCase, sendNotificationUseCase);
  }

  @On('messageCreate')
  async onMessage(message: Message): Promise<void> {
    await this.closedMessageHandler.execute(message);
  }
}
