import type { Guard, GuardContext } from '../../types';

/**
 * Guild-only guard
 * Ensures interactions can only be used in servers (not DMs)
 */
export class GuildOnlyGuard implements Guard {
  constructor(private readonly errorMessage = '❌ This command can only be used in a server!') {}

  async canActivate(context: GuardContext): Promise<boolean> {
    return context.interaction.guildId !== null;
  }

  async onFail(context: GuardContext): Promise<void> {
    if ('reply' in context.interaction && !context.interaction.replied && !context.interaction.deferred) {
      await context.interaction.reply({
        content: this.errorMessage,
        ephemeral: true,
      });
    }
  }
}
