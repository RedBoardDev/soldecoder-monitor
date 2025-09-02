import type { GuildSettingsEntity } from '@soldecoder-monitor/data';
import type { ServerSettingsOverview } from '../../domain/types/settings-server.types';

/**
 * Result for GetServerSettingsUseCase
 */
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

  get isForwardTpSlEnabled(): boolean {
    return this.guildSettings.forwardTpSl;
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
      forwardTpSl: this.guildSettings.forwardTpSl,
      positionSizeDefaults: this.guildSettings.positionSizeDefaults,
    };
  }
}
