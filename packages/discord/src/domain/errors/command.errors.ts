import { DiscordError } from './base.error';

/**
 * Base class for command-related errors
 */
export abstract class CommandError extends DiscordError {
  constructor(message: string, code: string, userMessage: string, context: Record<string, unknown> = {}) {
    super(message, code, userMessage, context);
  }
}

/**
 * Error thrown when command is not used in a guild
 */
export class NotInGuildError extends CommandError {
  constructor(commandName?: string) {
    super(
      `Command ${commandName || 'unknown'} can only be used in a server`,
      'NOT_IN_GUILD',
      '❌ This command can only be used in a server.',
      { commandName },
    );
  }
}

/**
 * Error thrown when command usage is invalid
 */
export class InvalidCommandUsageError extends CommandError {
  constructor(commandName: string, details?: string) {
    super(
      `Invalid usage of command ${commandName}: ${details || 'unknown'}`,
      'INVALID_COMMAND_USAGE',
      '❌ Invalid command usage. Please check your parameters and try again.',
      { commandName, details },
    );
  }
}

/**
 * Error thrown when required configuration is missing
 */
export class MissingConfigurationError extends CommandError {
  constructor(configType: string, guildId?: string) {
    super(
      `Missing required configuration: ${configType}`,
      'MISSING_CONFIGURATION',
      'ℹ️ Missing required configuration. Please configure server defaults first.',
      { configType, guildId },
    );
  }
}

/**
 * Error thrown when user lacks permission
 */
export class PermissionDeniedError extends CommandError {
  constructor(requiredPermission: string, userId?: string) {
    super(
      `Permission denied: ${requiredPermission}`,
      'PERMISSION_DENIED',
      '❌ You do not have permission to run this command.',
      { requiredPermission, userId },
    );
  }
}

/**
 * Error thrown when user is rate limited
 */
export class RateLimitedError extends CommandError {
  constructor(retryAfterMs: number, commandName?: string, userId?: string) {
    super(
      `Rate limited for ${retryAfterMs}ms`,
      'RATE_LIMITED',
      '⏳ You are doing that too often. Please try again later.',
      { retryAfterMs, commandName, userId },
    );
  }
}

/**
 * Error thrown when external service is unavailable
 */
export class ExternalServiceError extends CommandError {
  constructor(serviceName: string, details?: string) {
    super(
      `External service unavailable: ${serviceName} - ${details || 'unknown error'}`,
      'EXTERNAL_SERVICE_ERROR',
      '❌ A required external service is unavailable. Please try again later.',
      { serviceName, details },
    );
  }
}
