/**
 * Base error class for all application errors
 * Provides consistent error structure and user-friendly messages
 */
export abstract class DiscordError extends Error {
  /**
   * User-friendly message that can be displayed to Discord users
   */
  public readonly userMessage: string;

  /**
   * Error code for categorization and logging
   */
  public readonly code: string;

  /**
   * Additional context data for logging and debugging
   */
  public readonly context?: Record<string, unknown>;

  constructor(message: string, userMessage: string, code: string, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.userMessage = userMessage;
    this.code = code;
    this.context = context;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Returns formatted user message with emoji for Discord display
   */
  public getFormattedUserMessage(): string {
    return this.userMessage;
  }

  /**
   * Returns context for logging purposes
   */
  public getLogContext(): Record<string, unknown> {
    return {
      code: this.code,
      userMessage: this.userMessage,
      ...this.context,
    };
  }
}
