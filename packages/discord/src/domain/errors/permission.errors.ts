import { DiscordError } from './base.error';

/**
 * Base class for permission-related errors
 */
export abstract class PermissionError extends DiscordError {
  constructor(message: string, code: string, userMessage: string, context: Record<string, unknown> = {}) {
    super(message, code, userMessage, context);
  }
}

/**
 * Error thrown when bot lacks required permissions
 */
export class BotPermissionError extends PermissionError {
  constructor(missingPermissions: string[], channelId?: string, channelName?: string) {
    const permissionList = missingPermissions.join(', ');
    const location = channelName ? `in #${channelName}` : channelId ? `in channel ${channelId}` : '';

    super(
      `Bot missing permissions: ${permissionList} ${location}`,
      'BOT_PERMISSION_ERROR',
      `❌ **Missing Permissions**: I need the following permissions ${location}:\n${missingPermissions.map((p) => `• ${p}`).join('\n')}`,
      { missingPermissions, channelId, channelName },
    );
  }
}

/**
 * Error thrown when channel access is denied
 */
export class ChannelAccessError extends PermissionError {
  constructor(channelId: string, channelName?: string, reason?: string) {
    const location = channelName ? `#${channelName}` : channelId;

    super(
      `Channel access denied: ${location} - ${reason || 'unknown'}`,
      'CHANNEL_ACCESS_ERROR',
      `❌ I cannot access ${location}. Please check my permissions.`,
      { channelId, channelName, reason },
    );
  }
}

/**
 * Error thrown when channel feature permissions are missing
 */
export class ChannelFeaturePermissionError extends PermissionError {
  constructor(featureName: string, missingPermissions: string[], channelId?: string, channelName?: string) {
    const location = channelName ? `#${channelName}` : channelId ? `channel ${channelId}` : '';
    const permissionList = missingPermissions.join(', ');

    super(
      `Feature ${featureName} requires permissions: ${permissionList} ${location}`,
      'CHANNEL_FEATURE_PERMISSION_ERROR',
      `❌ **${featureName} Feature Unavailable**: Missing permissions ${location}:\n${missingPermissions.map((p) => `• ${p}`).join('\n')}`,
      { featureName, missingPermissions, channelId, channelName },
    );
  }
}

/**
 * Error thrown when mention permissions are missing
 */
export class MentionPermissionError extends PermissionError {
  constructor(mentionType: 'USER' | 'ROLE', channelId?: string, channelName?: string) {
    const location = channelName ? `#${channelName}` : channelId ? `channel ${channelId}` : '';

    super(
      `Mention permission denied for ${mentionType} ${location}`,
      'MENTION_PERMISSION_ERROR',
      `❌ I cannot send ${mentionType.toLowerCase()} mentions ${location}. Please check my permissions.`,
      { mentionType, channelId, channelName },
    );
  }
}
