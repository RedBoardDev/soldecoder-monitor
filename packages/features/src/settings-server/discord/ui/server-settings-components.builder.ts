import type { GuildSettingsEntity } from '@soldecoder-monitor/data';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export function buildServerSettingsComponents(guildSettings: GuildSettingsEntity): ActionRowBuilder<ButtonBuilder>[] {
  const components: ActionRowBuilder<ButtonBuilder>[] = [];

  // Main Configuration Row
  const mainConfigRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('settings:server:toggle:positionDisplay')
      .setLabel(guildSettings.positionDisplayEnabled ? 'Disable Position Display' : 'Enable Position Display')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('📊'),
    new ButtonBuilder()
      .setCustomId('settings:server:toggle:forwardTpSl')
      .setLabel(guildSettings.forwardTpSl ? 'Disable Forward TP/SL' : 'Enable Forward TP/SL')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🔄'),
    new ButtonBuilder()
      .setCustomId('settings:server:channel:select')
      .setLabel('Change Global Channel')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('📝'),
  );

  // Position Configuration Row
  const positionConfigRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('settings:server:position-defaults:modal')
      .setLabel('Edit Position Defaults')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('💰'),
  );

  components.push(mainConfigRow, positionConfigRow);
  return components;
}
