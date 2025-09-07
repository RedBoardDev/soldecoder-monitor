import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import type { SetupSession } from '../../../core';

export function buildStep4Embed(session: SetupSession): EmbedBuilder {
  const channelMention = session.data.globalChannelId ? `<#${session.data.globalChannelId}>` : 'Not selected';

  return new EmbedBuilder()
    .setTitle('🚀 Bot Setup - Step 4/5')
    .setDescription('**Configuration Summary**')
    .addFields(
      {
        name: '📝 Review Your Configuration',
        value: [
          `**Main Channel:** ${channelMention}`,
          '',
          '**Position Size Defaults:**',
          session.data.walletAddress
            ? `• Wallet: \`${session.data.walletAddress.slice(0, 8)}...${session.data.walletAddress.slice(-8)}\``
            : '• Wallet: Not configured',
          session.data.stopLossPercent ? `• Stop Loss: ${session.data.stopLossPercent}%` : '• Stop Loss: Not set',
          '',
          '**Features:**',
          `• Position Display: ${session.data.positionDisplayEnabled ? '✅ Enabled' : '❌ Disabled'}`,
          `• Forward Alerts: ${session.data.forward ? '✅ Enabled' : '❌ Disabled'}`,
        ].join('\n'),
        inline: false,
      },
      {
        name: '⚠️ Important',
        value:
          'Click **Confirm & Save** to finalize your configuration. You can modify these settings at any time later.',
        inline: false,
      },
    )
    .setColor(0x00ae86)
    .setFooter({ text: 'Step 4/5 • Review and confirm your configuration' });
}

export function buildStep4Components(): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('register-process:nav:back')
        .setLabel('Back')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⬅️'),
      new ButtonBuilder()
        .setCustomId('register-process:step4:confirm')
        .setLabel('Confirm & Save')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅'),
      new ButtonBuilder()
        .setCustomId('register-process:nav:cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌'),
    ),
  ];
}
