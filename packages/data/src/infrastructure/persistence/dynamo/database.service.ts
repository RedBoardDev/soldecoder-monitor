import type { ChannelConfigEntity } from '../../../domain/entities/channel-config.entity';
import type { GlobalMessageEntity } from '../../../domain/entities/global-message.entity';
import { GlobalMessageEntity as GlobalMessage } from '../../../domain/entities/global-message.entity';
import type { GuildSettingsEntity } from '../../../domain/entities/guild-settings.entity';
import { TableKey } from '../../../domain/value-objects/table-key.vo';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import { ChannelConfigMapper } from './mappers/channel-config.mapper';
import { GlobalMessageMapper } from './mappers/global-message.mapper';
import { GuildSettingsMapper } from './mappers/guild-settings.mapper';
import { DynamoPersistenceService } from './persistence.service';

const logger = createFeatureLogger('database');

/**
 * Clean Database Service using Persistence Service + Mappers
 * NO raw DynamoDB logic, NO mapping duplication
 * Pure orchestration of persistence operations with domain mapping
 */
export class DatabaseService {
  constructor(private readonly persistenceService: DynamoPersistenceService) {}

  /**
   * Factory method to create with default dependencies
   */
  static create(): DatabaseService {
    return new DatabaseService(new DynamoPersistenceService());
  }

  // ==================== CHANNEL CONFIG OPERATIONS ====================

  async getChannelConfig(channelId: string): Promise<ChannelConfigEntity | null> {
    try {
      const item = await this.persistenceService.getChannelConfigByChannelId(channelId);

      if (!item) {
        return null;
      }

      const guildId = (item.PK as string).replace('GUILD#', '');
      return ChannelConfigMapper.toDomain(item, channelId, guildId);
    } catch (error) {
      logger.error(`Failed to get channel config for ${channelId}`, error as Error);
      throw error;
    }
  }

  async getAllChannelConfigs(): Promise<ChannelConfigEntity[]> {
    try {
      const items = await this.persistenceService.getAllItemsByType('channel_config');
      return items.map((item) => ChannelConfigMapper.toDomainFromKeys(item));
    } catch (error) {
      logger.error('Failed to get all channel configs', error as Error);
      throw error;
    }
  }

  async saveChannelConfig(config: ChannelConfigEntity): Promise<void> {
    try {
      const item = ChannelConfigMapper.toDatabase(config);
      await this.persistenceService.putItem(item);
    } catch (error) {
      logger.error(`Failed to save channel config for ${config.channelId}`, error as Error);
      throw error;
    }
  }

  async deleteChannelConfig(channelId: string, guildId: string): Promise<void> {
    try {
      const tableKey = TableKey.channelConfig(guildId, channelId);
      await this.persistenceService.deleteItem(tableKey);
    } catch (error) {
      logger.error(`Failed to delete channel config for ${channelId}`, error as Error);
      throw error;
    }
  }

  // ==================== GUILD SETTINGS OPERATIONS ====================

  async getGuildSettings(guildId: string): Promise<GuildSettingsEntity | null> {
    try {
      const item = await this.persistenceService.getGuildSettings(guildId);

      if (!item) {
        return null;
      }

      return GuildSettingsMapper.toDomain(item, guildId);
    } catch (error) {
      logger.error(`Failed to get guild settings for ${guildId}`, error as Error);
      throw error;
    }
  }

  async getAllGuildSettings(): Promise<GuildSettingsEntity[]> {
    try {
      const items = await this.persistenceService.getAllItemsByType('guild_settings');
      return items.map((item) => GuildSettingsMapper.toDomainFromKeys(item));
    } catch (error) {
      logger.error('Failed to get all guild settings', error as Error);
      throw error;
    }
  }

  async saveGuildSettings(settings: GuildSettingsEntity): Promise<void> {
    try {
      const item = GuildSettingsMapper.toDatabase(settings);
      await this.persistenceService.putItem(item);
    } catch (error) {
      logger.error(`Failed to save guild settings for ${settings.guildId}`, error as Error);
      throw error;
    }
  }

  async deleteGuildSettings(guildId: string): Promise<void> {
    try {
      const tableKey = TableKey.guildSettings(guildId);
      await this.persistenceService.deleteItem(tableKey);
    } catch (error) {
      logger.error(`Failed to delete guild settings for ${guildId}`, error as Error);
      throw error;
    }
  }

  // ==================== GLOBAL MESSAGE OPERATIONS ====================

  async getGlobalMessage(guildId: string): Promise<GlobalMessageEntity | null> {
    try {
      const item = await this.persistenceService.getGlobalMessage(guildId);

      if (!item) {
        return null;
      }

      return GlobalMessageMapper.toDomain(item, guildId);
    } catch (error) {
      logger.error(`Failed to get global message for ${guildId}`, error as Error);
      throw error;
    }
  }

  async saveGlobalMessage(guildId: string, messageId: string): Promise<void> {
    try {
      const globalMessage = GlobalMessage.createNew(messageId, guildId);
      const item = GlobalMessageMapper.toDatabase(globalMessage);
      await this.persistenceService.putItem(item);
    } catch (error) {
      logger.error(`Failed to save global message for ${guildId}`, error as Error);
      throw error;
    }
  }

  async deleteGlobalMessage(guildId: string): Promise<void> {
    try {
      const tableKey = TableKey.globalMessage(guildId);
      await this.persistenceService.deleteItem(tableKey);
    } catch (error) {
      logger.error(`Failed to delete global message for ${guildId}`, error as Error);
      throw error;
    }
  }
}
