import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { GuildSettingsEntity } from '../../../domain/entities/guild-settings.entity';
import type { GuildSettingsRepository } from '../../../domain/interfaces/guild-settings.repository.interface';
import { CacheKey } from '../../../domain/value-objects/cache-key.vo';
import { DatabaseService } from '../../persistence/dynamo/database.service';
import { CachedRepositoryBase } from '../base/cached-repository.base';

const logger = createFeatureLogger('guild-settings-repo');

/**
 * DynamoDB implementation of GuildSettingsRepository with intelligent caching
 * Clean architecture with dependency injection and zero code duplication
 */
export class DynamoGuildSettingsRepository extends CachedRepositoryBase implements GuildSettingsRepository {
  constructor(private readonly databaseService: DatabaseService) {
    super();
  }

  /**
   * Factory method with default dependencies
   */
  static create(): DynamoGuildSettingsRepository {
    return new DynamoGuildSettingsRepository(DatabaseService.create());
  }

  async getByGuildId(guildId: string): Promise<GuildSettingsEntity | null> {
    const cacheKey = CacheKey.guildSettings(guildId).getValue();

    return this.cachedGet(cacheKey, () => this.databaseService.getGuildSettings(guildId), {
      guildId,
      operation: 'getByGuildId',
    });
  }

  async save(guildSettings: GuildSettingsEntity): Promise<void> {
    const cacheKey = CacheKey.guildSettings(guildSettings.guildId).getValue();

    await this.cachedSave(cacheKey, guildSettings, (settings) => this.databaseService.saveGuildSettings(settings), {
      guildId: guildSettings.guildId,
      operation: 'save',
    });
  }

  async delete(guildId: string): Promise<void> {
    const cacheKey = CacheKey.guildSettings(guildId).getValue();

    await this.cachedDelete(cacheKey, () => this.databaseService.deleteGuildSettings(guildId), {
      guildId,
      operation: 'delete',
    });
  }

  async exists(guildId: string): Promise<boolean> {
    const settings = await this.getByGuildId(guildId);
    return settings !== null;
  }

  async getAllGuilds(): Promise<GuildSettingsEntity[]> {
    logger.debug('Getting all guild settings');

    // Load all from database
    const allSettings = await this.databaseService.getAllGuildSettings();

    // Cache everything at once
    this.cacheMultiple(allSettings, (settings) => CacheKey.guildSettings(settings.guildId).getValue(), {
      operation: 'getAllGuilds',
    });

    logger.debug('All guild settings loaded and cached', { total: allSettings.length });

    return allSettings;
  }
}
