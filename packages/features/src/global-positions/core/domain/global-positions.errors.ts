import { DomainError } from '../../../shared/domain/errors/domain-error.errors';

export class NoConfiguredChannelsError extends DomainError {
  readonly code = 'NO_CONFIGURED_CHANNELS';
  readonly category = 'CONFIGURATION' as const;

  constructor(guildId: string) {
    super('ℹ️ No configured channels to read positions from.', { guildId });
  }
}

export class ChannelFetchError extends DomainError {
  readonly code = 'CHANNEL_FETCH_ERROR';
  readonly category = 'EXTERNAL_SERVICE' as const;

  constructor(channelId: string, originalError?: Error) {
    super(`❌ Could not fetch channel ${channelId}`, {
      channelId,
      originalError: originalError?.message,
    });
  }
}

export class MessageParseError extends DomainError {
  readonly code = 'MESSAGE_PARSE_ERROR';
  readonly category = 'BUSINESS_RULE' as const;

  constructor(channelId: string, originalError?: Error) {
    super(`❌ Could not parse message from channel ${channelId}`, {
      channelId,
      originalError: originalError?.message,
    });
  }
}

export class InvalidWalletAddressError extends DomainError {
  readonly code = 'INVALID_WALLET_ADDRESS';
  readonly category = 'VALIDATION' as const;

  constructor(walletAddress: string) {
    super(`❌ Invalid wallet address: ${walletAddress}`, { walletAddress });
  }
}
