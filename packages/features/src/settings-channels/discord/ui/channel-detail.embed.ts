import type { ChannelConfigEntity } from '@soldecoder-monitor/data';
import { EmbedBuilder } from 'discord.js';

export function buildChannelDetailEmbed(
  channelConfig: ChannelConfigEntity,
  channelName: string,
  tagDisplayName?: string,
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`⚙️ Channel Configuration: #${channelName}`)
    .setDescription(`**Configuring monitoring for** <#${channelConfig.channelId}>`)
    .addFields(
      {
        name: '📋 Current Configuration',
        value: [
          `**Close Notifications:** ${channelConfig.notifyOnClose ? '✅ Enabled' : '❌ Disabled'}`,
          `**Alert Threshold:** ${channelConfig.threshold && channelConfig.threshold > 0 ? `±${channelConfig.threshold}%` : '❌ Not set'}`,
          `**Position Images:** ${channelConfig.image ? '✅ Enabled' : '❌ Disabled'}`,
          `**Auto-Pin Messages:** ${channelConfig.pin ? '✅ Enabled' : '❌ Disabled'}`,
          `**Mention on Alert:** ${tagDisplayName || '❌ None configured'}`,
        ].join('\n'),
        inline: false,
      },
      {
        name: '💡 Feature Explanations',
        value: [
          '• **Close Notifications**: Alert when positions are closed in this channel',
          '• **Alert Threshold**: Trigger alerts when position changes by ±X%',
          '• **Position Images**: Include charts and stats from LPAgent data',
          '• **Auto-Pin Messages**: Pin important position notifications',
          '• **Mention on Alert**: Tag specific users/roles on notifications',
        ].join('\n'),
        inline: false,
      },
      {
        name: '🎯 Quick Actions',
        value: [
          '• Use the **toggle buttons** below to enable/disable features',
          '• Set **Alert Threshold** to ignore small position changes',
          '• Configure **Mentions** to notify specific users or roles',
          '• Click **Back** to return to the channel list',
        ].join('\n'),
        inline: false,
      },
    )
    .setColor(0x5865f2);

  return embed;
}
