/**
 * Command for getting channel settings overview for a guild
 */
export class GetChannelSettingsCommand {
  constructor(public readonly guildId: string) {
    this.validate();
  }

  private validate(): void {
    if (!this.guildId || this.guildId.trim().length === 0) {
      throw new Error('Guild ID is required and cannot be empty');
    }
  }
}
