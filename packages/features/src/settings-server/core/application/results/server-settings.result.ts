import type { GuildSettingsEntity } from '@soldecoder-monitor/data';
import type { ServerSettingsOverview } from '../../domain/types/settings-server.types';

export class ServerSettingsResult {
  constructor(
    public readonly guildSettings: GuildSettingsEntity,
    public readonly globalChannelName?: string,
  ) {}

  get hasGlobalChannel(): boolean {
    return this.guildSettings.globalChannelId !== null;
  }

  get isPositionDisplayEnabled(): boolean {
    return this.guildSettings.positionDisplayEnabled;
  }

  get isForwardEnabled(): boolean {
    return this.guildSettings.forward;
  }

  get hasPositionDefaults(): boolean {
    return (
      this.guildSettings.positionSizeDefaults.walletAddress !== null ||
      this.guildSettings.positionSizeDefaults.stopLossPercent !== null
    );
  }

  toOverview(): ServerSettingsOverview {
    return {
      guildId: this.guildSettings.guildId,
      positionDisplayEnabled: this.guildSettings.positionDisplayEnabled,
      globalChannelId: this.guildSettings.globalChannelId,
      globalChannelName: this.globalChannelName,
      forward: this.guildSettings.forward,
      positionSizeDefaults: this.guildSettings.positionSizeDefaults,
    };
  }
}
