/**
 * Command for removing a channel from monitoring configuration
 */
export class RemoveChannelCommand {
  constructor(public readonly channelId: string) {
    this.validate();
  }

  private validate(): void {
    if (!this.channelId || this.channelId.trim().length === 0) {
      throw new Error('Channel ID is required and cannot be empty');
    }
  }
}
