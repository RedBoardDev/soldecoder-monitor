import { DomainError } from '../../../../shared/domain';

export class SessionNotFoundError extends DomainError {
  readonly code = 'SESSION_NOT_FOUND';
  readonly category = 'BUSINESS_RULE' as const;

  constructor(guildId: string, userId: string) {
    super(`No active setup session found for user ${userId} in guild ${guildId}`, {
      guildId,
      userId,
    });
  }
}

export class SessionExpiredError extends DomainError {
  readonly code = 'SESSION_EXPIRED';
  readonly category = 'VALIDATION' as const;

  constructor(guildId: string, userId: string) {
    super('Your setup session has expired. Please run `/start` to begin again.', {
      guildId,
      userId,
    });
  }
}

export class InvalidStepNavigationError extends DomainError {
  readonly code = 'INVALID_STEP_NAVIGATION';
  readonly category = 'VALIDATION' as const;

  constructor(currentStep: number, targetStep: number) {
    super(`Cannot navigate from step ${currentStep} to step ${targetStep}`, {
      currentStep,
      targetStep,
    });
  }
}

export class SessionOwnershipError extends DomainError {
  readonly code = 'SESSION_OWNERSHIP';
  readonly category = 'VALIDATION' as const;

  constructor(sessionUserId: string, requestUserId: string) {
    super('You are not authorized to interact with this setup session.', {
      sessionUserId,
      requestUserId,
    });
  }
}

export class SessionDataIncompleteError extends DomainError {
  readonly code = 'SESSION_DATA_INCOMPLETE';
  readonly category = 'VALIDATION' as const;

  constructor(missingFields: string[]) {
    super(`Setup is incomplete. Missing required fields: ${missingFields.join(', ')}`, {
      missingFields,
    });
  }
}

export class SessionAlreadyExistsError extends DomainError {
  readonly code = 'SESSION_ALREADY_EXISTS';
  readonly category = 'VALIDATION' as const;

  constructor(guildId: string, userId: string) {
    super('A setup session is already in progress. Please complete or cancel the existing session.', {
      guildId,
      userId,
    });
  }
}
