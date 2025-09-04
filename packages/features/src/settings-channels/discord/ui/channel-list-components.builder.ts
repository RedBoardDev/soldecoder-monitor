import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  StringSelectMenuBuilder,
} from 'discord.js';
import type { ChannelSettingsResult } from '../../core/application/results/channel-settings.result';

/**
 * Build main management buttons for channel list
 */
export function buildChannelListButtons(result: ChannelSettingsResult): ActionRowBuilder<ButtonBuilder>[] {
  const components: ActionRowBuilder<ButtonBuilder>[] = [];
  const managementRow = new ActionRowBuilder<ButtonBuilder>();

  // Add Channel button (only if there are available channels)
  if (result.hasAvailableChannels) {
    managementRow.addComponents(
      new ButtonBuilder()
        .setCustomId('settings-channels:show_add')
        .setLabel('Add Channel')
        .setStyle(ButtonStyle.Success)
        .setEmoji('➕'),
    );
  }

  // Remove Channel button (only if there are configured channels)
  if (result.hasConfiguredChannels) {
    managementRow.addComponents(
      new ButtonBuilder()
        .setCustomId('settings-channels:show_remove')
        .setLabel('Remove Channel')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('➖'),
    );
  }

  if (managementRow.components.length > 0) {
    components.push(managementRow);
  }

  return components;
}

/**
 * Build add channel select menu
 */
export function buildAddChannelSelect(): ActionRowBuilder<ChannelSelectMenuBuilder> {
  return new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId('settings-channels:add')
      .setPlaceholder('Select a channel to add for monitoring')
      .setChannelTypes(ChannelType.GuildText)
      .setMinValues(1)
      .setMaxValues(1),
  );
}

/**
 * Build remove channel select menu
 */
export function buildRemoveChannelSelect(
  result: ChannelSettingsResult,
  guildChannels: Array<{ id: string; name: string }>,
): ActionRowBuilder<StringSelectMenuBuilder> {
  const options = result.channelConfigs.map((config) => {
    // Find the real channel name from guild channels
    const guildChannel = guildChannels.find((ch) => ch.id === config.channelId);
    const channelName = guildChannel?.name || 'Unknown Channel';

    return {
      label: `# ${channelName}`,
      description: 'Remove this channel from monitoring',
      value: config.channelId,
      emoji: '🗑️',
    };
  });

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('settings-channels:remove')
      .setPlaceholder('Select a channel to remove')
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(options),
  );
}

/**
 * Build channel config buttons for individual channel management
 */
export function buildChannelConfigButtons(
  result: ChannelSettingsResult,
  guildChannels: Array<{ id: string; name: string }>,
): ActionRowBuilder<ButtonBuilder>[] {
  const components: ActionRowBuilder<ButtonBuilder>[] = [];

  if (!result.hasConfiguredChannels) {
    return components;
  }

  // Group channels into rows of 5 buttons max per row
  for (let i = 0; i < result.channelConfigs.length; i += 5) {
    const channelRow = new ActionRowBuilder<ButtonBuilder>();
    const channelsSlice = result.channelConfigs.slice(i, i + 5);

    channelsSlice.forEach((config) => {
      const guildChannel = guildChannels.find((ch) => ch.id === config.channelId);
      const channelName = guildChannel?.name || 'Unknown';

      channelRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`settings-channels:config:${config.channelId}`)
          .setLabel(`# ${channelName}`)
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('⚙️'),
      );
    });

    components.push(channelRow);
  }

  return components;
}

/**
 * Build all components for channel list view
 */
export function buildChannelListComponents(
  result: ChannelSettingsResult,
  guildChannels: Array<{ id: string; name: string }>,
  showAddDropdown = false,
  showRemoveDropdown = false,
): ActionRowBuilder<ButtonBuilder | ChannelSelectMenuBuilder | StringSelectMenuBuilder>[] {
  const components: ActionRowBuilder<ButtonBuilder | ChannelSelectMenuBuilder | StringSelectMenuBuilder>[] = [];

  // Add management buttons (Add/Remove)
  const managementButtons = buildChannelListButtons(result);
  components.push(...managementButtons);

  // Add dropdown menus if requested
  if (showAddDropdown && result.hasAvailableChannels) {
    components.push(buildAddChannelSelect());
  }

  if (showRemoveDropdown && result.hasConfiguredChannels) {
    components.push(buildRemoveChannelSelect(result, guildChannels));
  }

  // Add individual channel config buttons
  const channelButtons = buildChannelConfigButtons(result, guildChannels);
  components.push(...channelButtons);

  return components;
}
