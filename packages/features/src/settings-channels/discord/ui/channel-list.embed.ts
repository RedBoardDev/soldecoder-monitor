import { EmbedBuilder } from 'discord.js';
import type { ChannelSettingsResult } from '../../core/application/results/channel-settings.result';
import { ChannelSettings } from '../../core/domain/value-objects/channel-settings.vo';

export function buildChannelListEmbed(result: ChannelSettingsResult): EmbedBuilder {
  const { channelConfigs: channels, availableChannels } = result;
  const embed = new EmbedBuilder()
    .setTitle('📊 Followed Channels Management')
    .setDescription(
      channels.length > 0
        ? `**${channels.length} channel${channels.length > 1 ? 's' : ''} configured** for position monitoring:`
        : '**No channels configured yet.** Add channels below to start monitoring positions!',
    )
    .setColor(0x5865f2);

  if (channels.length > 0) {
    channels.forEach((channel) => {
      // Find the channel name from available channels or fallback
      const channelName = availableChannels.find((ch) => ch.id === channel.channelId)?.name || 'Unknown';
      const summary = ChannelSettings.fromChannelConfig(channel, channelName);

      embed.addFields({
        name: summary.channelMention,
        value: summary.getFormattedConfiguration(),
        inline: true,
      });
    });

    embed.addFields({
      name: '💡 Quick Tips',
      value: [
        '• **Close Alerts** let you pause notifications without deleting channel settings',
        '• **Alert Threshold**: Ignore closed positions unless change exceeds this %',
        '• **Position Images** show charts from LPAgent data',
        '• Use **Mentions** to notify on each closed position',
      ].join('\n'),
      inline: false,
    });
  } else {
    embed.addFields({
      name: '🚀 Getting Started',
      value: [
        '1. Click **Add Channel** to start monitoring a channel',
        '2. Configure **Close Alerts** for position notifications',
        '3. Set an **Alert Threshold**',
        '4. Enable **Position Images** to see LPAgent charts',
      ].join('\n'),
      inline: false,
    });
  }

  return embed;
}
