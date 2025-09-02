import type { ChannelConfigEntity } from '@soldecoder-monitor/data';

/**
 * Result for UpdateChannelConfigUseCase
 */
export class UpdateChannelConfigResult {
  constructor(
    public readonly updatedConfig: ChannelConfigEntity,
    public readonly channelName: string,
    public readonly updatedFields: string[],
  ) {}

  get successMessage(): string {
    const fieldsText = this.updatedFields.join(', ');
    return `✅ **Settings Updated**\n\nChannel **#${this.channelName}** settings have been updated: ${fieldsText}`;
  }

  get channelId(): string {
    return this.updatedConfig.channelId;
  }
}
