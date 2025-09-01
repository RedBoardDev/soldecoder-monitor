import type { ChannelConfigEntity } from '@soldecoder-monitor/data';

/**
 * Value Object for Channel Settings
 * Encapsulates the presentation logic for channel configurations
 */
export class ChannelSettings {
  private constructor(
    public readonly channelId: string,
    public readonly channelName: string,
    public readonly configSummary: string[],
    public readonly detailedInfo: Record<string, string>,
  ) {}

  static fromChannelConfig(config: ChannelConfigEntity, channelName: string): ChannelSettings {
    const configSummary: string[] = [];
    const detailedInfo: Record<string, string> = {};

    // Build feature summary
    if (config.notifyOnClose) configSummary.push('🔔 Alerts');
    if (config.image) configSummary.push('📷 Images');
    if (config.pin) configSummary.push('📌 Auto-pin');
    if (config.tagType && config.tagType !== 'user' && config.tagType !== 'role') {
      // Handle the case where tagType is not null but also not 'NONE'
    } else if (config.tagType) {
      configSummary.push('🏷️ Mentions');
    }
    if (config.threshold && config.threshold > 0) {
      configSummary.push(`📊 ${config.threshold}% threshold`);
    }

    // Build detailed info
    detailedInfo['Close Alerts'] = config.notifyOnClose ? '✅ Enabled' : '❌ Disabled';
    detailedInfo['Alert Threshold'] = config.threshold && config.threshold > 0 ? `±${config.threshold}%` : '❌ Not set';
    detailedInfo['Position Images'] = config.image ? '✅ Enabled' : '❌ Disabled';
    detailedInfo['Auto-Pin'] = config.pin ? '✅ Enabled' : '❌ Disabled';

    // Handle mention configuration
    let mentionInfo = '❌ None';
    if (config.tagType && config.tagId) {
      mentionInfo = config.tagType === 'role' ? `<@&${config.tagId}>` : `<@${config.tagId}>`;
    }
    detailedInfo.Mentions = mentionInfo;

    return new ChannelSettings(config.channelId, channelName, configSummary, detailedInfo);
  }

  get featuresDescription(): string {
    return this.configSummary.length > 0 ? this.configSummary.join(' • ') : 'Basic monitoring';
  }

  get hasAnyFeatures(): boolean {
    return this.configSummary.length > 0;
  }

  get channelMention(): string {
    return `<#${this.channelId}>`;
  }

  getFormattedConfiguration(): string {
    return Object.entries(this.detailedInfo)
      .map(([name, value]) => `**${name}**: ${value}`)
      .join('\n');
  }
}
