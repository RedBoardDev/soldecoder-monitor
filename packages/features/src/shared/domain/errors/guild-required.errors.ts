import { DomainError } from './domain-error.errors';

export class GuildRequiredError extends DomainError {
  readonly code = 'GUILD_REQUIRED';
  readonly category = 'VALIDATION' as const;

  constructor() {
    super('❌ This command can only be used in a server.');
  }
}
