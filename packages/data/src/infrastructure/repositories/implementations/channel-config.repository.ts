import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { ChannelConfigEntity } from '../../../domain/entities/channel-config.entity';
import type { ChannelConfigRepository } from '../../../domain/interfaces/channel-config.repository.interface';
import { CacheKey } from '../../../domain/value-objects/cache-key.vo';
import { DatabaseService } from '../../persistence/dynamo/database.service';
import { CachedRepositoryBase } from '../base/cached-repository.base';

const logger = createFeatureLogger('channel-config-repo');

export class DynamoChannelConfigRepository extends CachedRepositoryBase implements ChannelConfigRepository {
  constructor(private readonly databaseService: DatabaseService) {
    super();
  }

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

    const cachedChannelIds = await this.cache.get<string[]>(guildCacheKey);

    if (cachedChannelIds && cachedChannelIds.length > 0) {
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

    logger.debug('Guild channels cache miss, loading from DB', { guildId });
    const allConfigs = await this.databaseService.getAllChannelConfigs();
    const guildConfigs = allConfigs.filter((config) => config.guildId === guildId);

    this.cacheMultiple(guildConfigs, (config) => CacheKey.channelConfig(config.channelId).getValue(), {
      guildId,
      operation: 'getByGuildId',
    });

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

    const guildCacheKey = CacheKey.guildChannels(channelConfig.guildId).getValue();
    await this.updateCacheList(guildCacheKey, channelConfig.channelId, 'add');
  }

  async delete(channelId: string): Promise<void> {
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

    const guildCacheKey = CacheKey.guildChannels(config.guildId).getValue();
    await this.updateCacheList(guildCacheKey, channelId, 'remove');
  }

  async exists(channelId: string): Promise<boolean> {
    const config = await this.getByChannelId(channelId);
    return config !== null;
  }

  async getAll(): Promise<ChannelConfigEntity[]> {
    logger.debug('Getting all channel configs');

    const allConfigs = await this.databaseService.getAllChannelConfigs();

 at once
    this.cacheMultiple(allConfigs, (config) => CacheKey.channelConfig(config.channelId).getValue(), {
      operation: 'getAll',
    });

    const guildChannelsMap = new Map<string, string[]>();
    for (const config of allConfigs) {
      const existing = guildChannelsMap.get(config.guildId) || [];
      existing.push(config.channelId);
      guildChannelsMap.set(config.guildId, existing);
    }

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
