import { DomainError } from './domain-error.errors';

export class InvalidWalletAddressError extends DomainError {
  readonly code = 'INVALID_WALLET_ADDRESS';
  readonly category = 'VALIDATION' as const;

  constructor(walletAddress: string) {
    super('❌ Invalid wallet address format.', { walletAddress });
  }
}
