/**
 * Base position domain error
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly category: 'EXTERNAL_SERVICE' | 'VALIDATION' | 'CONFIGURATION' | 'BUSINESS_RULE';

  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  /**
   * Convert error to loggable format
   */
  public toLogContext(): Record<string, unknown> {
    return {
      code: this.code,
      category: this.category,
      message: this.message,
      context: this.context,
    };
  }
}
