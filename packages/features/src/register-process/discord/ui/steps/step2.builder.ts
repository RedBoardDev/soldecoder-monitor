import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import type { SetupSession } from '../../../core';

export function buildStep2Embed(session: SetupSession): EmbedBuilder {
  const channelMention = session.data.globalChannelId ? `<#${session.data.globalChannelId}>` : 'Not selected';

  const embed = new EmbedBuilder()
    .setTitle('🚀 Bot Setup - Step 2/5')
    .setDescription('**Wallet & Position Size Configuration**')
    .setColor(0x00ae86);

  if (session.data.walletAddress) {
    embed.addFields({
      name: '✅ Configuration',
      value: [
        `**Channel:** ${channelMention}`,
        `**Wallet:** \`${session.data.walletAddress.slice(0, 8)}...${session.data.walletAddress.slice(-8)}\``,
        session.data.stopLossPercent ? `**Stop Loss:** ${session.data.stopLossPercent}%` : '**Stop Loss:** Not set',
      ].join('\n'),
    });
  } else {
    embed.addFields(
      {
        name: '✅ Selected Channel',
        value: channelMention,
        inline: false,
      },
      {
        name: '💰 Wallet Configuration (Optional)',
        value: [
          '• **Main Wallet**: Your Solana address for position tracking',
          '• **Stop Loss**: Default percentage for position sizing',
          '• These will be used for `/position-size` command and wallet summaries',
          '• Summaries will be sent to the global channel you configured above',
          '',
          "*You can skip this step if you don't need wallet related features.*",
        ].join('\n'),
      },
    );
  }

  embed.setFooter({
    text: session.data.walletAddress
      ? 'Step 2/5 • Wallet configured - Continue or reconfigure'
      : 'Step 2/5 • Configure wallet or skip',
  });

  return embed;
}

export function buildStep2Components(hasWallet: boolean): ActionRowBuilder<ButtonBuilder>[] {
  const components: ActionRowBuilder<ButtonBuilder>[] = [];

  if (hasWallet) {
    components.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('register-process:step2:wallet-modal')
          .setLabel('Reconfigure Wallet')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('🔄'),
        new ButtonBuilder()
          .setCustomId('register-process:step2:skip')
          .setLabel('Continue')
          .setStyle(ButtonStyle.Success)
          .setEmoji('▶️'),
      ),
    );
  } else {
    components.push(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('register-process:step2:wallet-modal')
          .setLabel('Configure Wallet')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('💰'),
        new ButtonBuilder()
          .setCustomId('register-process:step2:skip')
          .setLabel('Skip')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('▶️'),
      ),
    );
  }

  components.push(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('register-process:nav:back')
        .setLabel('Back')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⬅️'),
      new ButtonBuilder()
        .setCustomId('register-process:nav:cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌'),
    ),
  );

  return components;
}
