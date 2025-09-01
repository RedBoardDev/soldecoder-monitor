import { DomainError } from '../../../shared/domain/errors/domain-error.errors';

export class MissingPositionConfigurationError extends DomainError {
  readonly code = 'MISSING_POSITION_CONFIGURATION';
  readonly category = 'CONFIGURATION' as const;

  constructor(missingField: 'wallet' | 'stoploss', guildId?: string) {
    const messages = {
      wallet:
        'ℹ️ No default wallet set. Provide `wallet` option or set defaults via `/server-settings → Position Size Defaults`.',
      stoploss:
        'ℹ️ No default stop loss set. Provide `stoploss` option or set defaults via `/server-settings → Position Size Defaults`.',
    };

    super(messages[missingField], { missingField, guildId });
  }
}

// ============= VALIDATION ERRORS =============

export class InvalidStoplossPercentError extends DomainError {
  readonly code = 'INVALID_STOPLOSS_PERCENT';
  readonly category = 'VALIDATION' as const;

  constructor(stoploss: number) {
    super('❌ Stop loss percent must be between 0.1% and 100%.', { stoploss });
  }
}

export class InvalidCurrentSizeError extends DomainError {
  readonly code = 'INVALID_CURRENT_SIZE';
  readonly category = 'VALIDATION' as const;

  constructor(currentSize: number) {
    super('❌ Current size must be greater than 0.', { currentSize });
  }
}

// ============= BUSINESS RULE ERRORS =============

export class PositionCalculationError extends DomainError {
  readonly code = 'POSITION_CALCULATION_ERROR';
  readonly category = 'BUSINESS_RULE' as const;

  constructor(reason: string, context?: Record<string, unknown>) {
    super(`❌ Position calculation failed: ${reason}`, context);
  }
}

export class WalletInfoServiceError extends DomainError {
  readonly code = 'WALLET_INFO_SERVICE_ERROR';
  readonly category = 'EXTERNAL_SERVICE' as const;

  constructor(walletAddress: string, originalError?: Error) {
    super(`❌ Could not fetch wallet information for ${walletAddress}`, {
      walletAddress,
      originalError: originalError?.message,
    });
  }
}
