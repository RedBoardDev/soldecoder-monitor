import type { ServerSettingsUpdate } from '../../domain/types/settings-server.types';

/**
 * Command to update server settings
 */
export class UpdateServerSettingsCommand {
  constructor(
    public readonly guildId: string,
    public readonly updates: ServerSettingsUpdate,
  ) {}
}
