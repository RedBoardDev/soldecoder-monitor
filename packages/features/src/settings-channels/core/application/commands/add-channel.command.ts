/**
 * Command for adding a channel to monitoring configuration
 */
export class AddChannelCommand {
  constructor(
    public readonly channelId: string,
    public readonly guildId: string,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.channelId || this.channelId.trim().length === 0) {
      throw new Error('Channel ID is required and cannot be empty');
    }

    if (!this.guildId || this.guildId.trim().length === 0) {
      throw new Error('Guild ID is required and cannot be empty');
    }
  }
}
