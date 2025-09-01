/**
 * Cache Key Value Object
 * Centralized cache key generation to avoid duplication and ensure consistency
 */
export class CacheKey {
  private constructor(private readonly value: string) {}

  public getValue(): string {
    return this.value;
  }

  public toString(): string {
    return this.value;
  }

  // ============= CHANNEL CONFIG CACHE KEYS =============

  /**
   * Cache key for individual channel configuration
   */
  static channelConfig(channelId: string): CacheKey {
    return new CacheKey(`channel_config:${channelId}`);
  }

  /**
   * Cache key for guild's channel list
   */
  static guildChannels(guildId: string): CacheKey {
    return new CacheKey(`guild_channels:${guildId}`);
  }

  // ============= GUILD SETTINGS CACHE KEYS =============

  /**
   * Cache key for guild settings
   */
  static guildSettings(guildId: string): CacheKey {
    return new CacheKey(`guild_settings:${guildId}`);
  }

  // ============= GLOBAL MESSAGE CACHE KEYS =============

  /**
   * Cache key for global position message
   */
  static globalMessage(guildId: string): CacheKey {
    return new CacheKey(`global_message:${guildId}`);
  }

  // ============= UTILITY METHODS =============

  /**
   * Check if this key matches a pattern
   */
  public matches(pattern: string): boolean {
    return this.value.includes(pattern);
  }

  /**
   * Get the entity type from cache key
   */
  public getEntityType(): string {
    return this.value.split(':')[0];
  }

  /**
   * Get the entity ID from cache key
   */
  public getEntityId(): string {
    const parts = this.value.split(':');
    return parts.length > 1 ? parts[1] : '';
  }
}
