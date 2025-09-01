import type { ChannelConfigEntity } from '../entities/channel-config.entity';

/**
 * Channel Configuration repository interface
 */
export interface ChannelConfigRepository {
  /**
   * Get channel configuration by channel ID
   */
  getByChannelId(channelId: string): Promise<ChannelConfigEntity | null>;

  /**
   * Get all channel configurations for a guild
   */
  getByGuildId(guildId: string): Promise<ChannelConfigEntity[]>;

  /**
   * Get all channel configurations
   */
  getAll(): Promise<ChannelConfigEntity[]>;

  /**
   * Save channel configuration
   */
  save(channelConfig: ChannelConfigEntity): Promise<void>;

  /**
   * Delete channel configuration
   */
  delete(channelId: string): Promise<void>;

  /**
   * Check if channel configuration exists
   */
  exists(channelId: string): Promise<boolean>;
}
