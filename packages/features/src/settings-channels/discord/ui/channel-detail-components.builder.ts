import type { ChannelConfigEntity } from '@soldecoder-monitor/data';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { ThresholdVO } from '../../core/domain/value-objects/threshold.vo';

/**
 * Build toggle buttons for channel configuration settings
 */
export function buildChannelDetailComponents(channelConfig: ChannelConfigEntity): ActionRowBuilder<ButtonBuilder>[] {
  const components: ActionRowBuilder<ButtonBuilder>[] = [];

  const thresholdVO = new ThresholdVO(channelConfig.threshold);

  // Row 1: Threshold settings
  const thresholdRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`settings-channels:threshold:${channelConfig.channelId}`)
      .setLabel('Custom Threshold')
      .setStyle(thresholdVO.isNumeric ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setEmoji('📊'),
    new ButtonBuilder()
      .setCustomId(`settings-channels:threshold:quick:tp:${channelConfig.channelId}`)
      .setLabel('TP Only')
      .setStyle(channelConfig.threshold === 'TP' ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setEmoji('🎯'),
    new ButtonBuilder()
      .setCustomId(`settings-channels:threshold:quick:sl:${channelConfig.channelId}`)
      .setLabel('SL Only')
      .setStyle(channelConfig.threshold === 'SL' ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setEmoji('🛑'),
    new ButtonBuilder()
      .setCustomId(`settings-channels:threshold:quick:tpsl:${channelConfig.channelId}`)
      .setLabel('TP & SL')
      .setStyle(channelConfig.threshold === 'TP/SL' ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setEmoji('⚡'),
  );

  // Row 2: Display settings
  const displayRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`settings-channels:toggle:image:${channelConfig.channelId}`)
      .setLabel(channelConfig.image ? 'Disable Position Images' : 'Enable Position Images')
      .setStyle(channelConfig.image ? ButtonStyle.Secondary : ButtonStyle.Success)
      .setEmoji('📷'),
    new ButtonBuilder()
      .setCustomId(`settings-channels:toggle:pin:${channelConfig.channelId}`)
      .setLabel(channelConfig.pin ? 'Disable Auto-Pin' : 'Enable Auto-Pin')
      .setStyle(channelConfig.pin ? ButtonStyle.Secondary : ButtonStyle.Success)
      .setEmoji('📌'),
  );

  // Row 3: Mention settings
  const tagRow = new ActionRowBuilder<ButtonBuilder>();
  tagRow.addComponents(
    new ButtonBuilder()
      .setCustomId(`settings-channels:tag:select_user:${channelConfig.channelId}`)
      .setLabel('Mention User')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('👤'),
    new ButtonBuilder()
      .setCustomId(`settings-channels:tag:select_role:${channelConfig.channelId}`)
      .setLabel('Mention Role')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('👥'),
  );

  if (channelConfig.tagType && channelConfig.tagId) {
    tagRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`settings-channels:tag:clear:${channelConfig.channelId}`)
        .setLabel('Clear Mentions')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🚫'),
    );
  }

  // Row 4: Navigation
  const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('settings-channels:back')
      .setLabel('⬅️ Back to Channel List')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('📋'),
  );

  components.push(thresholdRow, displayRow, tagRow, navRow);
  return components;
}
