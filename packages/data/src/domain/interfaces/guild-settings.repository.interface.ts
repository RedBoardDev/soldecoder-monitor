import type { GuildSettingsEntity } from '../entities/guild-settings.entity';

/**
 * Guild Settings repository interface
 */
export interface GuildSettingsRepository {
  /**
   * Get guild settings by guild ID
   */
  getByGuildId(guildId: string): Promise<GuildSettingsEntity | null>;

  /**
   * Get all guild settings
   */
  getAllGuilds(): Promise<GuildSettingsEntity[]>;

  /**
   * Save guild settings
   */
  save(guildSettings: GuildSettingsEntity): Promise<void>;

  /**
   * Delete guild settings
   */
  delete(guildId: string): Promise<void>;

  /**
   * Check if guild settings exist
   */
  exists(guildId: string): Promise<boolean>;
}
