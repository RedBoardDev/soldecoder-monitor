import type { ChannelConfigEntity } from '@soldecoder-monitor/data';
import { ThresholdVO } from './threshold.vo';

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

    if (config.image) configSummary.push('📷');
    if (config.pin) configSummary.push('📌');
    if (config.tagType && config.tagType !== 'user' && config.tagType !== 'role') {
    } else if (config.tagType) {
      configSummary.push('🏷️');
    }
    if (config.threshold !== null) {
      const thresholdVO = new ThresholdVO(config.threshold);
      configSummary.push(thresholdVO.getEmoji());
    }

    const thresholdVO = new ThresholdVO(config.threshold);
    detailedInfo['Alert Threshold'] = thresholdVO.isNumeric ? thresholdVO.getDisplayText() : thresholdVO.getEmoji();

    detailedInfo['Position Images'] = config.image ? '✅' : '❌';
    detailedInfo['Auto-Pin'] = config.pin ? '✅' : '❌';

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

  get emojiSummary(): string {
    if (this.configSummary.length === 0) {
      return '📊 Basic monitoring';
    }
    return this.configSummary.join(' ');
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
