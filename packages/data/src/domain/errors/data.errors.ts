/**
 * Base domain error for the data layer
 */
export abstract class DataDomainError extends Error {
  abstract readonly code: string;
  abstract readonly category: 'NOT_FOUND' | 'VALIDATION' | 'PERSISTENCE' | 'CACHE';

  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  /**
   * Convert error to loggable format
   */
  public toLogContext(): Record<string, unknown> {
    return {
      code: this.code,
      category: this.category,
      message: this.message,
      context: this.context,
    };
  }
}

// ============= CHANNEL CONFIG ERRORS =============

export class ChannelConfigNotFoundError extends DataDomainError {
  readonly code = 'CHANNEL_CONFIG_NOT_FOUND';
  readonly category = 'NOT_FOUND' as const;

  constructor(channelId: string) {
    super(`Channel configuration not found for channel: ${channelId}`, { channelId });
  }
}

export class InvalidChannelConfigError extends DataDomainError {
  readonly code = 'INVALID_CHANNEL_CONFIG';
  readonly category = 'VALIDATION' as const;

  constructor(reason: string, context?: Record<string, unknown>) {
    super(`Invalid channel configuration: ${reason}`, context);
  }
}

// ============= GUILD SETTINGS ERRORS =============

export class GuildSettingsNotFoundError extends DataDomainError {
  readonly code = 'GUILD_SETTINGS_NOT_FOUND';
  readonly category = 'NOT_FOUND' as const;

  constructor(guildId: string) {
    super(`Guild settings not found for guild: ${guildId}`, { guildId });
  }
}

export class InvalidGuildSettingsError extends DataDomainError {
  readonly code = 'INVALID_GUILD_SETTINGS';
  readonly category = 'VALIDATION' as const;

  constructor(reason: string, context?: Record<string, unknown>) {
    super(`Invalid guild settings: ${reason}`, context);
  }
}

// ============= GLOBAL MESSAGE ERRORS =============

export class GlobalMessageNotFoundError extends DataDomainError {
  readonly code = 'GLOBAL_MESSAGE_NOT_FOUND';
  readonly category = 'NOT_FOUND' as const;

  constructor(guildId: string) {
    super(`Global message not found for guild: ${guildId}`, { guildId });
  }
}

export class InvalidGlobalMessageError extends DataDomainError {
  readonly code = 'INVALID_GLOBAL_MESSAGE';
  readonly category = 'VALIDATION' as const;

  constructor(reason: string, context?: Record<string, unknown>) {
    super(`Invalid global message: ${reason}`, context);
  }
}

// ============= PERSISTENCE ERRORS =============

export class PersistenceError extends DataDomainError {
  readonly code = 'PERSISTENCE_ERROR';
  readonly category = 'PERSISTENCE' as const;

  constructor(operation: string, reason: string, context?: Record<string, unknown>) {
    super(`Persistence operation failed [${operation}]: ${reason}`, context);
  }
}

// ============= CACHE ERRORS =============

export class CacheError extends DataDomainError {
  readonly code = 'CACHE_ERROR';
  readonly category = 'CACHE' as const;

  constructor(operation: string, reason: string, context?: Record<string, unknown>) {
    super(`Cache operation failed [${operation}]: ${reason}`, context);
  }
}
