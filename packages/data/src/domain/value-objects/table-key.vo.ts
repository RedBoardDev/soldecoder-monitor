/**
 * DynamoDB Table Key Value Object
 * Centralized table key generation for consistent DynamoDB operations
 */
export class TableKey {
  constructor(
    public readonly PK: string,
    public readonly SK: string,
  ) {}

  /**
   * Convert to DynamoDB key format
   */
  public toDynamoKey(): { PK: string; SK: string } {
    return {
      PK: this.PK,
      SK: this.SK,
    };
  }

  /**
   * Check if this is a guild-related key
   */
  public isGuildKey(): boolean {
    return this.PK.startsWith('GUILD#');
  }

  /**
   * Extract guild ID from the key
   */
  public getGuildId(): string {
    return this.PK.replace('GUILD#', '');
  }

  /**
   * Extract entity type from SK
   */
  public getEntityType(): string {
    if (this.SK === 'SETTINGS') return 'guild_settings';
    if (this.SK === 'GLOBAL_MESSAGE') return 'global_message';
    if (this.SK.startsWith('CHANNEL#')) return 'channel_config';
    return 'unknown';
  }

  // ============= FACTORY METHODS =============

  /**
   * Create table key for channel configuration
   */
  static channelConfig(guildId: string, channelId: string): TableKey {
    return new TableKey(`GUILD#${guildId}`, `CHANNEL#${channelId}`);
  }

  /**
   * Create table key for guild settings
   */
  static guildSettings(guildId: string): TableKey {
    return new TableKey(`GUILD#${guildId}`, 'SETTINGS');
  }

  /**
   * Create table key for global message
   */
  static globalMessage(guildId: string): TableKey {
    return new TableKey(`GUILD#${guildId}`, 'GLOBAL_MESSAGE');
  }

  // ============= GSI KEYS =============

  /**
   * Create GSI key for channel lookup
   */
  static channelGSI(channelId: string, guildId: string): { GSI_PK: string; GSI_SK: string } {
    return {
      GSI_PK: `CHANNEL#${channelId}`,
      GSI_SK: `GUILD#${guildId}`,
    };
  }

  /**
   * Create query key for channel index
   */
  static channelIndexQuery(channelId: string): { GSI_PK: string } {
    return {
      GSI_PK: `CHANNEL#${channelId}`,
    };
  }
}
