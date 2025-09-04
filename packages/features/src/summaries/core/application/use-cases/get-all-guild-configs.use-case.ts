import type { GuildSettingsRepository } from '@soldecoder-monitor/data';
import { createFeatureLogger } from '@soldecoder-monitor/logger';

const logger = createFeatureLogger('get-all-guild-configs-use-case');

/**
 * Use case for retrieving all guild configurations for weekly summaries.
 * This is used by the weekly scheduler to process all configured guilds.
 */
export class GetAllGuildConfigsUseCase {
  constructor(private readonly guildSettingsRepository: GuildSettingsRepository) {}

  /**
   * Execute the use case to get all guild configurations
   * @returns Promise resolving to array of guild settings
   */
  async execute() {
    try {
      logger.debug('Retrieving all guild configurations for weekly summary');

      const allGuildConfigs = await this.guildSettingsRepository.getAllGuilds();

      logger.debug(`Found ${allGuildConfigs.length} guild configurations`, {
        guildCount: allGuildConfigs.length,
      });

      return allGuildConfigs;
    } catch (error) {
      logger.error('Failed to retrieve guild configurations', error as Error);
      throw error;
    }
  }
}
