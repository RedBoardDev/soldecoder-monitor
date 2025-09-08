import type { GuildSettingsEntity } from '@soldecoder-monitor/data';

export class UpdateServerSettingsResult {
  constructor(
    public readonly guildSettings: GuildSettingsEntity,
    public readonly updatedFields: string[],
  ) {}

  get hasUpdates(): boolean {
    return this.updatedFields.length > 0;
  }

  get updateSummary(): string {
    if (!this.hasUpdates) return 'No changes made';
    return `Updated: ${this.updatedFields.join(', ')}`;
  }
}
