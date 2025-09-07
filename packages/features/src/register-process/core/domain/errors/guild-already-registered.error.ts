import { DomainError } from '../../../../shared/domain';

/**
 * Guild Already Registered Error
 */
export class GuildAlreadyRegisteredError extends DomainError {
  readonly code = 'GUILD_ALREADY_REGISTERED';
  readonly category = 'BUSINESS_RULE' as const;

  constructor(guildId: string) {
    super(
      'This server is already configured. Use `/settings-server` to modify your server configuration and `/settings-channels` to modify your channels configuration.',
      {
        guildId,
      },
    );
  }
}
