import type { Guard, GuardContext, Logger } from '../types';

/**
 * Guard executor
 * Executes guards in sequence and handles failures
 */
export class GuardExecutor {
  constructor(private readonly logger: Logger) {}

  /**
   * Execute guards in sequence
   * @param guards - Array of guards to execute
   * @param context - Guard execution context
   * @returns true if all guards pass, false otherwise
   */
  async execute(guards: Guard[], context: GuardContext): Promise<boolean> {
    for (const guard of guards) {
      try {
        const canActivate = await guard.canActivate(context);

        if (!canActivate) {
          // Call onFail if defined
          if (guard.onFail) {
            try {
              await guard.onFail(context);
            } catch (failError) {
              this.logger.error(`Error in guard onFail handler:`, failError);
            }
          }

          return false;
        }
      } catch (error) {
        this.logger.error(`Error executing guard ${guard.constructor.name}:`, error);
        return false;
      }
    }

    return true;
  }
}
