import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import type { SetupSession } from '../../../core';

export function buildStep3Embed(session: SetupSession): EmbedBuilder {
  const channelMention = session.data.globalChannelId ? `<#${session.data.globalChannelId}>` : 'Not selected';

  return new EmbedBuilder()
    .setTitle('🚀 Bot Setup - Step 3/5')
    .setDescription('**Feature Configuration**')
    .addFields(
      {
        name: '✅ Current Configuration',
        value: [
          `**Channel:** ${channelMention}`,
          session.data.walletAddress
            ? `**Wallet:** \`${session.data.walletAddress.slice(0, 8)}...${session.data.walletAddress.slice(-8)}\``
            : '**Wallet:** Not configured',
          session.data.stopLossPercent ? `**Stop Loss:** ${session.data.stopLossPercent}%` : '**Stop Loss:** Not set',
        ].join('\n'),
        inline: false,
      },
      {
        name: '⚙️ Feature Settings',
        value: [
          `• **Position Display:** ${session.data.positionDisplayEnabled ? '✅ Enabled' : '❌ Disabled'}`,
          `  *Shows position from configured channels in the global channel*`,
          '',
          `• **Forward Alerts:** ${session.data.forward ? '✅ Enabled' : '❌ Disabled'}`,
          `  *Forwards alerts based on channel threshold settings*`,
        ].join('\n'),
      },
    )
    .setColor(0x00ae86)
    .setFooter({ text: 'Step 3/5 • Configure features and continue' });
}

export function buildStep3Components(session: SetupSession): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('register-process:step3:toggle-position')
        .setLabel(session.data.positionDisplayEnabled ? 'Disable Position Display' : 'Enable Position Display')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📊'),
      new ButtonBuilder()
        .setCustomId('register-process:step3:toggle-forward')
        .setLabel(session.data.forward ? 'Disable Forward' : 'Enable Forward')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔄'),
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('register-process:nav:back')
        .setLabel('Back')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⬅️'),
      new ButtonBuilder()
        .setCustomId('register-process:step3:continue')
        .setLabel('Continue')
        .setStyle(ButtonStyle.Success)
        .setEmoji('▶️'),
      new ButtonBuilder()
        .setCustomId('register-process:nav:cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌'),
    ),
  ];
}
