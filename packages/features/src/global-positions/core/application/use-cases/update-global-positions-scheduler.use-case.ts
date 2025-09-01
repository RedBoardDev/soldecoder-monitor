import { time } from '@shared';
import type { DynamoChannelConfigRepository, GuildSettingsRepository } from '@soldecoder-monitor/data';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { Client } from 'discord.js';
import type { GlobalMessageUpdateService } from '../../infrastructure/services/global-message-update.service';
import { delay, processGuildPositions } from '../helpers/guild-processor.helper';

const logger = createFeatureLogger('update-global-positions-scheduler-use-case');

/**
 * Use case for scheduled updates of global position displays across all guilds.
 * Coordinates the scheduled updates by delegating to specialized helpers.
 */
export class UpdateGlobalPositionsSchedulerUseCase {
  private readonly GUILD_PROCESSING_DELAY_MS = time.seconds(3);

  constructor(
    private readonly guildSettingsRepository: GuildSettingsRepository,
    private readonly channelConfigRepository: DynamoChannelConfigRepository,
    private readonly globalMessageService: GlobalMessageUpdateService,
  ) {}

  /**
   * Execute the scheduled update for all eligible guilds
   * @param client Discord client instance
   */
  async execute(client: Client): Promise<void> {
    try {
      const allGuilds = await this.guildSettingsRepository.getAllGuilds();
      const eligibleGuilds = allGuilds.filter(
        (guild) => guild.positionDisplayEnabled && guild.globalChannelId && guild.guildId,
      );

      if (eligibleGuilds.length === 0) {
        logger.debug('No eligible guilds found for position display updates');
        return;
      }

      // Process each guild sequentially with delay
      let processedCount = 0;
      let failedCount = 0;

      for (const guildSettings of eligibleGuilds) {
        try {
          await processGuildPositions(
            client,
            guildSettings.guildId,
            this.guildSettingsRepository,
            this.channelConfigRepository,
            this.globalMessageService,
          );
          processedCount++;
        } catch (error) {
          failedCount++;
          logger.warn('Failed to process guild', {
            guildId: guildSettings.guildId,
            error: error instanceof Error ? error.message : String(error),
          });
        }

        // Add delay between guild processing (except for the last one)
        if (processedCount + failedCount < eligibleGuilds.length) {
          await delay(this.GUILD_PROCESSING_DELAY_MS);
        }
      }
    } catch (error) {
      logger.error('Scheduled position update failed', error as Error);
    }
  }
}
