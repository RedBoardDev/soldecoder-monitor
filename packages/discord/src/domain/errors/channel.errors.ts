import { DiscordError } from './base.error';

/**
 * Base class for channel-related errors
 */
export abstract class ChannelError extends DiscordError {
  constructor(message: string, code: string, userMessage: string, context: Record<string, unknown> = {}) {
    super(message, code, userMessage, context);
  }
}

/**
 * Error thrown when channel is not found
 */
export class ChannelNotFoundError extends ChannelError {
  constructor(channelId: string, guildId?: string) {
    super(
      `Channel not found: ${channelId}`,
      'CHANNEL_NOT_FOUND',
      '❌ **Channel Not Found**: The specified channel does not exist or I cannot access it.',
      { channelId, guildId },
    );
  }
}

/**
 * Error thrown when channel type is invalid
 */
export class InvalidChannelTypeError extends ChannelError {
  constructor(channelId: string, actualType: string, channelName?: string) {
    const location = channelName ? `#${channelName}` : channelId;

    super(
      `Invalid channel type: ${actualType} for channel ${channelId}`,
      'INVALID_CHANNEL_TYPE',
      `❌ **Invalid Channel Type**: ${location} is not a text channel (type: ${actualType}).`,
      { channelId, actualType, channelName },
    );
  }
}

/**
 * Error thrown when channel is not accessible
 */
export class ChannelNotAccessibleError extends ChannelError {
  constructor(channelId: string, reason: string, channelName?: string) {
    const location = channelName ? `#${channelName}` : channelId;

    super(
      `Channel not accessible: ${location} - ${reason}`,
      'CHANNEL_NOT_ACCESSIBLE',
      `❌ **Channel Not Accessible**: I cannot access ${location}. ${reason}`,
      { channelId, reason, channelName },
    );
  }
}

/**
 * Error thrown when channel operation fails
 */
export class ChannelOperationError extends ChannelError {
  constructor(operation: string, channelId: string, error: string, channelName?: string) {
    const location = channelName ? `#${channelName}` : channelId;

    super(
      `Channel operation failed: ${operation} on ${location} - ${error}`,
      'CHANNEL_OPERATION_ERROR',
      `❌ **Operation Failed**: Cannot ${operation} in ${location}. Please try again later.`,
      { operation, channelId, error, channelName },
    );
  }
}

/**
 * Error thrown when channel feature permission is missing
 */
export class ChannelFeaturePermissionError extends ChannelError {
  constructor(featureName: string, missingPermissions: string[], channelId?: string, channelName?: string) {
    const location = channelName ? `#${channelName}` : channelId;

    super(
      `Channel feature permission error: ${featureName} - missing permissions: ${missingPermissions.join(', ')}`,
      'CHANNEL_FEATURE_PERMISSION_ERROR',
      `❌ **Channel Feature Permission Error**: I cannot use ${featureName} in ${location}. Please check my permissions.`,
      { featureName, missingPermissions, channelId, channelName },
    );
  }
}

/**
 * Error thrown when mention permission is missing
 */
export class MentionPermissionError extends ChannelError {
  constructor(mentionType: 'USER' | 'ROLE', channelId?: string, channelName?: string) {
    const location = channelName ? `#${channelName}` : channelId;

    super(
      `Mention permission error: ${mentionType}`,
      'MENTION_PERMISSION_ERROR',
      `❌ **Mention Permission Error**: I cannot use ${mentionType} in ${location}. Please check my permissions.`,
      { mentionType, channelId, channelName },
    );
  }
}
