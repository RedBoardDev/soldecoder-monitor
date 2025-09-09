import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  EmbedBuilder,
} from 'discord.js';

export function buildStep1Embed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🚀 Bot Setup - Step 1/5')
    .setDescription('**Welcome to the SolDecoder Monitor Setup!**')
    .addFields({
      name: '📝 Global Channel Selection',
      value: [
        '• Select the main channel for global position notifications',
        '• This channel will receive:',
        '  - Global positions updates',
        '  - TP/SL forwards (configurable via toggle later)',
        '  - Wallet summaries (coming soon)',
        '',
        '**Requirements:**',
        '• Must be a text channel',
        '• Bot needs Send Messages and Embed Links permissions',
      ].join('\n'),
    })
    .setColor(0x00ae86)
    .setFooter({ text: 'Step 1/5 • Select a channel to continue' });
}

export function buildStep1Components(): ActionRowBuilder<ChannelSelectMenuBuilder | ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('register-process:step1:channel')
        .setPlaceholder('📝 Select the main notification channel...')
        .setChannelTypes(ChannelType.GuildText),
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('register-process:nav:cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌'),
    ),
  ];
}
