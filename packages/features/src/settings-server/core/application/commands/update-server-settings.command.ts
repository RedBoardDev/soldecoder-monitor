import type { ServerSettingsUpdate } from '../../domain/types/settings-server.types';

export class UpdateServerSettingsCommand {
  constructor(
    public readonly guildId: string,
    public readonly updates: ServerSettingsUpdate,
  ) {}
}
