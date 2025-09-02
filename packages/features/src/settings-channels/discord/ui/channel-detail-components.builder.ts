import type { ChannelConfigEntity } from '@soldecoder-monitor/data';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

/**
 * Build toggle buttons for channel configuration settings
 */
export function buildChannelDetailComponents(channelConfig: ChannelConfigEntity): ActionRowBuilder<ButtonBuilder>[] {
  const components: ActionRowBuilder<ButtonBuilder>[] = [];

  // Row 1: Notification settings
  const notificationRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`settings:channel:toggle:notifyOnClose:${channelConfig.channelId}`)
      .setLabel(channelConfig.notifyOnClose ? 'Disable Close Alerts' : 'Enable Close Alerts')
      .setStyle(channelConfig.notifyOnClose ? ButtonStyle.Secondary : ButtonStyle.Success)
      .setEmoji('🔔'),
    new ButtonBuilder()
      .setCustomId(`settings:channel:threshold:${channelConfig.channelId}`)
      .setLabel('Set Alert Threshold')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('📊'),
  );

  // Row 2: Display settings
  const displayRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`settings:channel:toggle:image:${channelConfig.channelId}`)
      .setLabel(channelConfig.image ? 'Disable Position Images' : 'Enable Position Images')
      .setStyle(channelConfig.image ? ButtonStyle.Secondary : ButtonStyle.Success)
      .setEmoji('📷'),
    new ButtonBuilder()
      .setCustomId(`settings:channel:toggle:pin:${channelConfig.channelId}`)
      .setLabel(channelConfig.pin ? 'Disable Auto-Pin' : 'Enable Auto-Pin')
      .setStyle(channelConfig.pin ? ButtonStyle.Secondary : ButtonStyle.Success)
      .setEmoji('📌'),
  );

  // Row 3: Mention settings
  const tagRow = new ActionRowBuilder<ButtonBuilder>();
  tagRow.addComponents(
    new ButtonBuilder()
      .setCustomId(`settings:channel:tag:select_user:${channelConfig.channelId}`)
      .setLabel('Mention User')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('👤'),
    new ButtonBuilder()
      .setCustomId(`settings:channel:tag:select_role:${channelConfig.channelId}`)
      .setLabel('Mention Role')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('👥'),
  );

  // Add clear button if there's a configured tag
  if (channelConfig.tagType && channelConfig.tagId) {
    tagRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`settings:channel:tag:clear:${channelConfig.channelId}`)
        .setLabel('Clear Mentions')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🚫'),
    );
  }

  // Row 4: Navigation
  const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('settings:channels:back')
      .setLabel('⬅️ Back to Channel List')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('📋'),
  );

  components.push(notificationRow, displayRow, tagRow, navRow);
  return components;
}
