import { EmbedBuilder } from 'discord.js';
import type { ServerSettingsResult } from '../../core/application/results/server-settings.result';

export function buildServerSettingsEmbed(result: ServerSettingsResult): EmbedBuilder {
  const { guildSettings, globalChannelName } = result;

  const embed = new EmbedBuilder()
    .setTitle('🔧 Server Configuration')
    .setDescription('**Manage your bot settings and global channel configuration**')
    .setColor(0x5865f2);

  const mainSettings = [
    `• **Global Channel:** ${globalChannelName ? `#${globalChannelName}` : 'Not configured'}`,
    `• **Position Display:** ${guildSettings.positionDisplayEnabled ? '✅ Enabled' : '❌ Disabled'}`,
    `• **Forward Alerts:** ${guildSettings.forward ? '✅ Enabled' : '❌ Disabled'}`,
  ].join('\n');

  const summarySettings = [
    `• **Weekly Summary:** ${guildSettings.summaryPreferences.weeklySummary ? '✅ Enabled' : '❌ Disabled'}`,
    `• **Monthly Summary:** ${guildSettings.summaryPreferences.monthlySummary ? '✅ Enabled' : '❌ Disabled'}`,
  ].join('\n');

  const positionDefaults = guildSettings.positionSizeDefaults;
  const systemSettings = [
    `• **Position Size Defaults:** ${
      positionDefaults.walletAddress || positionDefaults.stopLossPercent !== null
        ? `Wallet: \`${positionDefaults.walletAddress?.slice(0, 8) || 'Not set'}...\` • Stop Loss: ${positionDefaults.stopLossPercent ?? 'Not set'}%`
        : 'Not configured'
    }`,
  ].join('\n');

  embed.addFields(
    {
      name: '📊 Main Configuration',
      value: mainSettings,
      inline: false,
    },
    {
      name: '📈 Summary Settings',
      value: summarySettings,
      inline: false,
    },
    {
      name: '⚙️ Position Settings',
      value: systemSettings,
      inline: false,
    },
    {
      name: '💡 Settings Explanation',
      value: [
        '• **Position Display**: Shows position summaries from followed channels in global channel',
        '• **Forward Alerts**: Forwards alerts based on channel threshold settings to global channel',
        '• **Weekly/Monthly Summary**: Automated performance reports sent to global channel',
        '• **Position Size Defaults**: Default wallet and stop-loss for `/position-size` command',
      ].join('\n'),
      inline: false,
    },
    {
      name: '🔗 Quick Access',
      value: '📋 **Manage Channels** → Use `/settings-channels` to configure followed channels',
      inline: false,
    },
  );

  return embed;
}
