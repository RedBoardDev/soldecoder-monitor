import { DomainError } from '../../../../shared/domain/errors/domain-error.errors';

export class GuildSettingsNotFoundError extends DomainError {
  readonly code = 'GUILD_SETTINGS_NOT_FOUND';
  readonly category = 'CONFIGURATION' as const;

  constructor(guildId: string) {
    super('❌ Server settings not found. Please contact an administrator.', { guildId });
  }
}

export class InvalidServerSettingsError extends DomainError {
  readonly code = 'INVALID_SERVER_SETTINGS';
  readonly category = 'VALIDATION' as const;

  constructor(message: string, context?: Record<string, unknown>) {
    super(`❌ ${message}`, context);
  }
}

export class InsufficientPermissionsError extends DomainError {
  readonly code = 'INSUFFICIENT_PERMISSIONS';
  readonly category = 'VALIDATION' as const;

  constructor() {
    super('❌ Administrator permissions required to modify server settings.');
  }
}

export class ChannelAccessError extends DomainError {
  readonly code = 'CHANNEL_ACCESS_ERROR';
  readonly category = 'VALIDATION' as const;

  constructor(channelId: string) {
    super('❌ Bot cannot access the selected channel.', { channelId });
  }
}
