import { ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType } from 'discord.js';

export function buildChannelSelectComponent(): ActionRowBuilder<ChannelSelectMenuBuilder> {
  const channelSelect = new ChannelSelectMenuBuilder()
    .setCustomId('settings-server:channel:set')
    .setPlaceholder('Select a channel for summaries and position display...')
    .setChannelTypes(ChannelType.GuildText)
    .setMinValues(1)
    .setMaxValues(1);

  return new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelSelect);
}
