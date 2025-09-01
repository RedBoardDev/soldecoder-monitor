import type { ChannelConfigEntity } from '@soldecoder-monitor/data';

/**
 * Result for AddChannelUseCase
 */
export class AddChannelResult {
  constructor(
    public readonly channelConfig: ChannelConfigEntity,
    public readonly channelName: string,
    public readonly isNewConfiguration: boolean,
  ) {}

  get successMessage(): string {
    return `✅ **Channel Added Successfully**\n\nChannel **#${this.channelName}** has been added to position monitoring with default settings.`;
  }
}
