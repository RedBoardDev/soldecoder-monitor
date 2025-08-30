import type { Guard, GuardContext, RateLimitOptions } from '../../types';

interface RateLimitData {
  count: number;
  resetAt: number;
}

/**
 * Rate limit guard
 * Implements basic in-memory rate limiting
 */
export class RateLimitGuard implements Guard {
  private static readonly store = new Map<string, RateLimitData>();
  private static cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private readonly options: RateLimitOptions) {
    // Start cleanup if not already running
    if (!RateLimitGuard.cleanupInterval) {
      RateLimitGuard.cleanupInterval = setInterval(() => {
        RateLimitGuard.cleanup();
      }, 60000); // Clean up every minute
    }
  }

  async canActivate(context: GuardContext): Promise<boolean> {
    const key = this.getKey(context);
    const now = Date.now();

    const data = RateLimitGuard.store.get(key);

    if (!data || data.resetAt <= now) {
      // Reset or create new window
      RateLimitGuard.store.set(key, {
        count: 1,
        resetAt: now + this.options.window,
      });
      return true;
    }

    if (data.count >= this.options.max) {
      return false;
    }

    data.count++;
    return true;
  }

  async onFail(context: GuardContext): Promise<void> {
    const key = this.getKey(context);
    const data = RateLimitGuard.store.get(key);

    let timeRemaining = 'a moment';
    if (data) {
      const seconds = Math.ceil((data.resetAt - Date.now()) / 1000);
      if (seconds > 60) {
        timeRemaining = `${Math.ceil(seconds / 60)} minute(s)`;
      } else {
        timeRemaining = `${seconds} second(s)`;
      }
    }

    // Support for {timeRemaining} placeholder in custom messages
    const message = this.options.message
      ? this.options.message.replace('{timeRemaining}', timeRemaining)
      : `⏱️ You're being rate limited. Please wait ${timeRemaining} before trying again.`;

    if ('reply' in context.interaction) {
      if (context.interaction.replied || context.interaction.deferred) {
        await context.interaction.followUp({
          content: message,
          ephemeral: true,
        });
      } else {
        await context.interaction.reply({
          content: message,
          ephemeral: true,
        });
      }
    }
  }

  private getKey(context: GuardContext): string {
    const { interaction } = context;
    const scope = this.options.scope || 'user';
    const base = `ratelimit:${context.featureName}:${context.methodName}`;

    switch (scope) {
      case 'user':
        return `${base}:user:${interaction.user.id}`;
      case 'guild':
        return `${base}:guild:${interaction.guildId || 'dm'}`;
      case 'channel':
        return `${base}:channel:${interaction.channelId}`;
      case 'global':
        return `${base}:global`;
      default:
        return `${base}:user:${interaction.user.id}`;
    }
  }

  /**
   * Clean up expired entries
   */
  static cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, data] of RateLimitGuard.store.entries()) {
      if (data.resetAt <= now) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      RateLimitGuard.store.delete(key);
    }
  }

  /**
   * Stop cleanup interval (for testing or shutdown)
   */
  static stopCleanup(): void {
    if (RateLimitGuard.cleanupInterval) {
      clearInterval(RateLimitGuard.cleanupInterval);
      RateLimitGuard.cleanupInterval = null;
    }
  }
}
