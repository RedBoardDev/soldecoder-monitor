import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { ChannelConfigEntity } from '../../../domain/entities/channel-config.entity';
import type { ChannelConfigRepository } from '../../../domain/interfaces/channel-config.repository.interface';
import { CacheKey } from '../../../domain/value-objects/cache-key.vo';
import { DatabaseService } from '../../persistence/dynamo/database.service';
import { CachedRepositoryBase } from '../base/cached-repository.base';

const logger = createFeatureLogger('channel-config-repo');

/**
 * DynamoDB implementation of ChannelConfigRepository with intelligent caching
 * Clean architecture with dependency injection and zero code duplication
 */
export class DynamoChannelConfigRepository extends CachedRepositoryBase implements ChannelConfigRepository {
  constructor(private readonly databaseService: DatabaseService) {
    super();
  }

  /**
   * Factory method with default dependencies
   */
  static create(): DynamoChannelConfigRepository {
    return new DynamoChannelConfigRepository(DatabaseService.create());
  }

  async getByChannelId(channelId: string): Promise<ChannelConfigEntity | null> {
    const cacheKey = CacheKey.channelConfig(channelId).getValue();

    return this.cachedGet(cacheKey, () => this.databaseService.getChannelConfig(channelId), {
      channelId,
      operation: 'getByChannelId',
    });
  }

  async getByGuildId(guildId: string): Promise<ChannelConfigEntity[]> {
    const guildCacheKey = CacheKey.guildChannels(guildId).getValue();

    // Try to get cached channel IDs list
    const cachedChannelIds = await this.cache.get<string[]>(guildCacheKey);

    if (cachedChannelIds && cachedChannelIds.length > 0) {
      // Try to get all channels from cache
      const configs: ChannelConfigEntity[] = [];
      let allFound = true;

      for (const channelId of cachedChannelIds) {
        const channelCacheKey = CacheKey.channelConfig(channelId).getValue();
        const config = await this.cache.get<ChannelConfigEntity>(channelCacheKey);
        if (config) {
          configs.push(config);
        } else {
          allFound = false;
          break;
        }
      }

      if (allFound) {
        logger.debug('All guild channels found in cache', { guildId, count: configs.length });
        return configs;
      }
    }

    // Fallback: load from database
    logger.debug('Guild channels cache miss, loading from DB', { guildId });
    const allConfigs = await this.databaseService.getAllChannelConfigs();
    const guildConfigs = allConfigs.filter((config) => config.guildId === guildId);

    // Cache everything
    this.cacheMultiple(guildConfigs, (config) => CacheKey.channelConfig(config.channelId).getValue(), {
      guildId,
      operation: 'getByGuildId',
    });

    // Cache the guild channels list
    const channelIds = guildConfigs.map((config) => config.channelId);
    this.cache.set(guildCacheKey, channelIds, this.defaultTtlMs);

    return guildConfigs;
  }

  async save(channelConfig: ChannelConfigEntity): Promise<void> {
    const cacheKey = CacheKey.channelConfig(channelConfig.channelId).getValue();

    await this.cachedSave(cacheKey, channelConfig, (config) => this.databaseService.saveChannelConfig(config), {
      channelId: channelConfig.channelId,
      guildId: channelConfig.guildId,
      operation: 'save',
    });

    // Update guild channels list
    const guildCacheKey = CacheKey.guildChannels(channelConfig.guildId).getValue();
    await this.updateCacheList(guildCacheKey, channelConfig.channelId, 'add');
  }

  async delete(channelId: string): Promise<void> {
    // First get the config to know the guildId
    const config = await this.getByChannelId(channelId);
    if (!config) {
      logger.debug('Channel config not found for deletion', { channelId });
      return;
    }

    const cacheKey = CacheKey.channelConfig(channelId).getValue();

    await this.cachedDelete(cacheKey, () => this.databaseService.deleteChannelConfig(channelId, config.guildId), {
      channelId,
      guildId: config.guildId,
      operation: 'delete',
    });

    // Update guild channels list
    const guildCacheKey = CacheKey.guildChannels(config.guildId).getValue();
    await this.updateCacheList(guildCacheKey, channelId, 'remove');
  }

  async exists(channelId: string): Promise<boolean> {
    const config = await this.getByChannelId(channelId);
    return config !== null;
  }

  async getAll(): Promise<ChannelConfigEntity[]> {
    logger.debug('Getting all channel configs');

    // Load all from database
    const allConfigs = await this.databaseService.getAllChannelConfigs();

    // Cache everything at once
    this.cacheMultiple(allConfigs, (config) => CacheKey.channelConfig(config.channelId).getValue(), {
      operation: 'getAll',
    });

    // Group by guild and cache guild channels lists
    const guildChannelsMap = new Map<string, string[]>();
    for (const config of allConfigs) {
      const existing = guildChannelsMap.get(config.guildId) || [];
      existing.push(config.channelId);
      guildChannelsMap.set(config.guildId, existing);
    }

    // Cache all guild channels lists
    for (const [guildId, channelIds] of guildChannelsMap) {
      const guildCacheKey = CacheKey.guildChannels(guildId).getValue();
      this.cache.set(guildCacheKey, channelIds, this.defaultTtlMs);
    }

    logger.debug('All channel configs loaded and cached', {
      total: allConfigs.length,
      guilds: guildChannelsMap.size,
    });

    return allConfigs;
  }
}
