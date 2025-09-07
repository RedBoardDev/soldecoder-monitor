import { EmbedBuilder } from 'discord.js';

export function buildStep5Embed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🎉 SOL Decoder Bot - Setup Complete!')
    .setDescription("**Your server is now configured! Here's everything you need to know:**")
    .addFields(
      {
        name: '✅ Global Channel Configuration',
        value: [
          '• **Main Channel**: Central hub for all bot notifications',
          '• **Forward TP/SL**: Take-profit and stop-loss alerts from monitored channels',
          '• **Position Display**: Summary messages of positions from monitored channels',
          '• **Wallet Summaries**: Weekly/monthly performance reports (coming soon, data from LPAgent API)',
          '',
          'ℹ️ *Note: Multi-wallet configuration is coming soon!*',
        ].join('\n'),
        inline: false,
      },
      {
        name: '🔧 Server Settings (`/settings-server`)',
        value: [
          '• **Position Display**: Toggle overview of positions from monitored channels in global channel',
          '• **Forward TP/SL**: Toggle take-profit/stop-loss alerts from monitored channels to global channel',
          // '• **Auto-delete Warnings**: Automatically remove bot warning messages',
          '• **Position Size Defaults**: Update wallet address and stop loss % (useful for `/position-size` command)',
          '• **Global Channel**: Change the main notification channel',
        ].join('\n'),
        inline: false,
      },
      {
        name: '📊 Channel Configuration (`/settings-channels`)',
        value: [
          '• **Add/Remove Channels**: Configure which channels the bot monitors',
          '• **Notify on Close**: Get alerts when positions close',
          '• **Image Attachments**: Include position charts from LPAgent data',
          '• **Pin Messages**: Automatically pin important notifications',
          '• **Threshold**: Set ±% change triggers for alerts',
          '• **Tags**: Mention specific users/roles on notifications',
          '',
          '💡 **Tip**: Set SolDecoder farmer notification interval to 1 minute for real-time tracking',
        ].join('\n'),
        inline: false,
      },
      {
        name: '🚀 Key Features & Commands',
        value: [
          '• `/position-size` - Calculate optimal position sizes based on your wallet',
          '• `/global-positions` - View aggregated positions across all monitored channels',
          '• `/nft-price` - Check SOL Decoder NFT collection floor prices',
          '• `/help` - Display the list of commands',
          '• `/guide` - Show this complete guide anytime',
          '',
          '**Data Source**: All position images and summaries stats come from **LPAgent API**',
          '**Real-time**: Bot monitors your channels and processes position messages automatically from monitored channels',
        ].join('\n'),
        inline: false,
      },
      {
        name: '📈 Wallet Summaries (Coming Soon)',
        value: [
          '• **Weekly Summaries**: Comprehensive weekly performance reports',
          '• **Monthly Summaries**: Detailed monthly analytics and insights',
          '• **Performance Metrics**: P&L, win rate, average position size',
          '• **Trend Analysis**: Position patterns and trading behavior',
          '• **Automated Delivery**: Sent to your global channel automatically',
        ].join('\n'),
        inline: false,
      },
      {
        name: '⚡ Pro Tips',
        value: [
          '• Start by adding 1-2 channels with **Notify on Close** enabled',
          '• Use **Position Display** to get summaries in your global channel',
          '• Configure **Tags** to notify your team on important position changes',
          '• The bot automatically parses position data from LPAgent messages',
        ].join('\n'),
        inline: false,
      },
    )
    .setColor(0x00d966)
    .setFooter({ text: 'Setup complete • Start by configuring your first channels with /settings-channels!' });
}
