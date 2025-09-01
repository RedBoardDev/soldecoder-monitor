/**
 * Result for RemoveChannelUseCase
 */
export class RemoveChannelResult {
  constructor(
    public readonly channelId: string,
    public readonly channelName: string,
    public readonly wasConfigured: boolean,
  ) {}

  get successMessage(): string {
    return `✅ **Channel Removed Successfully**\n\nChannel **#${this.channelName}** has been removed from position monitoring.`;
  }
}
