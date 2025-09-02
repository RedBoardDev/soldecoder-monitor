import type { ChannelConfigEntity } from '@soldecoder-monitor/data';

/**
 * Result for GetChannelConfigUseCase
 */
export class ChannelConfigResult {
  constructor(
    public readonly channelConfig: ChannelConfigEntity,
    public readonly channelName: string,
  ) {}

  get exists(): boolean {
    return true;
  }

  get channelId(): string {
    return this.channelConfig.channelId;
  }

  get channelMention(): string {
    return `<#${this.channelConfig.channelId}>`;
  }
}
