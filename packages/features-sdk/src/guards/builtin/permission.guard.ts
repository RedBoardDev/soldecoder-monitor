import type { PermissionResolvable } from 'discord.js';
import { PermissionsBitField } from 'discord.js';
import type { Guard, GuardContext } from '../../types';

/**
 * Permission guard
 * Checks if user has required permissions
 */
export class PermissionGuard implements Guard {
  private readonly requiredPermissions: PermissionsBitField;

  constructor(permissions: PermissionResolvable[]) {
    this.requiredPermissions = new PermissionsBitField(permissions);
  }

  async canActivate(context: GuardContext): Promise<boolean> {
    // Must be in a guild
    if (!context.interaction.guildId) {
      return false;
    }

    // Check member permissions
    const member = context.interaction.member;
    if (!member || typeof member.permissions === 'string') {
      return false;
    }

    return member.permissions.has(this.requiredPermissions);
  }

  async onFail(context: GuardContext): Promise<void> {
    const missingPerms = this.getMissingPermissions(context);
    const permList =
      missingPerms.length > 0 ? `\n\nMissing permissions:\n${missingPerms.map((p) => `• ${p}`).join('\n')}` : '';

    const message = `❌ You don't have the required permissions to use this command!${permList}`;

    if ('reply' in context.interaction && !context.interaction.replied && !context.interaction.deferred) {
      await context.interaction.reply({
        content: message,
        ephemeral: true,
      });
    }
  }

  private getMissingPermissions(context: GuardContext): string[] {
    const member = context.interaction.member;
    if (!member || typeof member.permissions === 'string') {
      return Array.from(this.requiredPermissions.toArray()).map((p) => this.formatPermissionName(p.toString()));
    }

    const missing = this.requiredPermissions.missing(member.permissions);
    return missing.map((p) => this.formatPermissionName(p));
  }

  private formatPermissionName(permission: string): string {
    // Convert SCREAMING_SNAKE_CASE to Title Case
    return permission
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }
}
