import { DomainError } from '@shared/domain';

/**
 * Error thrown when closed message content cannot be parsed
 */
export class ClosedMessageParseError extends DomainError {
  public readonly code = 'CLOSED_MESSAGE_PARSE_ERROR';
  public readonly category = 'VALIDATION';

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'ClosedMessageParseError';
  }
}

/**
 * Error thrown when wallet address extraction fails
 */
export class WalletAddressExtractionError extends DomainError {
  public readonly code = 'WALLET_ADDRESS_EXTRACTION_ERROR';
  public readonly category = 'EXTERNAL_SERVICE';

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'WalletAddressExtractionError';
  }
}

/**
 * Error thrown when position data fetching fails
 */
export class PositionDataFetchError extends DomainError {
  public readonly code = 'POSITION_DATA_FETCH_ERROR';
  public readonly category = 'EXTERNAL_SERVICE';

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'PositionDataFetchError';
  }
}

/**
 * Error thrown when channel configuration is invalid
 */
export class InvalidChannelConfigError extends DomainError {
  public readonly code = 'INVALID_CHANNEL_CONFIG_ERROR';
  public readonly category = 'CONFIGURATION';

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'InvalidChannelConfigError';
  }
}

/**
 * Error thrown when message processing fails
 */
export class ClosedMessageProcessingError extends DomainError {
  public readonly code = 'CLOSED_MESSAGE_PROCESSING_ERROR';
  public readonly category = 'BUSINESS_RULE';

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
    this.name = 'ClosedMessageProcessingError';
  }
}
