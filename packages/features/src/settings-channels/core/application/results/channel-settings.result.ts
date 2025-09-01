import type { ChannelConfigEntity } from '@soldecoder-monitor/data';
import type { ChannelInfo, ChannelSettingsOverview } from '../../domain/types/settings-channels.types';

/**
 * Result for GetChannelSettingsUseCase
 */
export class ChannelSettingsResult {
  constructor(
    public readonly guildId: string,
    public readonly channelConfigs: ChannelConfigEntity[],
    public readonly availableChannels: ChannelInfo[],
    public readonly totalConfigured: number,
  ) {}

  get hasConfiguredChannels(): boolean {
    return this.totalConfigured > 0;
  }

  get hasAvailableChannels(): boolean {
    return this.availableChannels.length > 0;
  }

  isChannelConfigured(channelId: string): boolean {
    return this.channelConfigs.some((config) => config.channelId === channelId);
  }

  getChannelConfig(channelId: string): ChannelConfigEntity | undefined {
    return this.channelConfigs.find((config) => config.channelId === channelId);
  }

  toOverview(): ChannelSettingsOverview {
    return {
      guildId: this.guildId,
      channelConfigs: this.channelConfigs,
      availableChannels: this.availableChannels,
      totalConfigured: this.totalConfigured,
    };
  }
}
