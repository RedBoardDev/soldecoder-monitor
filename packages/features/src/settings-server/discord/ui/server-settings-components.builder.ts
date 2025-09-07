import type { GuildSettingsEntity } from '@soldecoder-monitor/data';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export function buildServerSettingsComponents(guildSettings: GuildSettingsEntity): ActionRowBuilder<ButtonBuilder>[] {
  const components: ActionRowBuilder<ButtonBuilder>[] = [];

  // Première ligne : Change Global Channel et Edit Position
  const firstRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('settings-server:channel:select')
      .setLabel('Change Global Channel')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('📝'),
    new ButtonBuilder()
      .setCustomId('settings-server:position-defaults:modal')
      .setLabel('Edit Position Defaults')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('💰'),
  );

  // Deuxième ligne : Disable Position Display et Disable Forward
  const secondRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('settings-server:toggle:positionDisplay')
      .setLabel(guildSettings.positionDisplayEnabled ? 'Disable Position Display' : 'Enable Position Display')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('📊'),
    new ButtonBuilder()
      .setCustomId('settings-server:toggle:forward')
      .setLabel(guildSettings.forward ? 'Disable Forward' : 'Enable Forward')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🔄'),
  );

  // Troisième ligne : Boutons Summary
  const thirdRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('settings-server:toggle:weeklySummary')
      .setLabel(guildSettings.summaryPreferences.weeklySummary ? 'Disable Weekly Summary' : 'Enable Weekly Summary')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('📅'),
    new ButtonBuilder()
      .setCustomId('settings-server:toggle:monthlySummary')
      .setLabel(guildSettings.summaryPreferences.monthlySummary ? 'Disable Monthly Summary' : 'Enable Monthly Summary')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('📊'),
  );

  components.push(firstRow, secondRow, thirdRow);
  return components;
}
