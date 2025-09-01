import { DomainError } from '@shared';

export class ChannelAlreadyConfiguredError extends DomainError {
  readonly code = 'CHANNEL_ALREADY_CONFIGURED';
  readonly category = 'BUSINESS_RULE' as const;

  constructor(channelId: string, channelName: string) {
    super(
      `❌ **Channel Already Configured**\n\nThe channel **#${channelName}** is already being monitored. Each channel can only be configured once.`,
      {
        channelId,
        channelName,
      },
    );
  }
}

export class NoChannelsConfiguredError extends DomainError {
  readonly code = 'NO_CHANNELS_CONFIGURED';
  readonly category = 'CONFIGURATION' as const;

  constructor(guildId: string) {
    super(
      '📭 **No Channels Configured**\n\nThis server has no channels configured for position monitoring yet. Use the **Add Channel** button to get started!',
      {
        guildId,
      },
    );
  }
}

export class ChannelConfigNotFoundError extends DomainError {
  readonly code = 'CHANNEL_CONFIG_NOT_FOUND';
  readonly category = 'CONFIGURATION' as const;

  constructor(channelId: string) {
    super(
      `❌ **Channel Configuration Not Found**\n\nThe requested channel configuration could not be found. It may have been removed.`,
      {
        channelId,
      },
    );
  }
}

export class InvalidChannelConfigurationError extends DomainError {
  readonly code = 'INVALID_CHANNEL_CONFIGURATION';
  readonly category = 'VALIDATION' as const;

  constructor(channelId: string, reason: string) {
    super(`❌ **Invalid Channel Configuration**\n\n${reason}`, {
      channelId,
      reason,
    });
  }
}
