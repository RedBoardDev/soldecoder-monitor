import { ActionRowBuilder, RoleSelectMenuBuilder, UserSelectMenuBuilder } from 'discord.js';

/**
 * Build user select component for channel tagging
 */
export function buildUserSelectComponent(channelId: string): ActionRowBuilder<UserSelectMenuBuilder> {
  return new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
    new UserSelectMenuBuilder()
      .setCustomId(`settings-channels:tag:user:${channelId}`)
      .setPlaceholder('Select a user to tag when notifications are sent')
      .setMinValues(1)
      .setMaxValues(1),
  );
}

/**
 * Build role select component for channel tagging
 */
export function buildRoleSelectComponent(channelId: string): ActionRowBuilder<RoleSelectMenuBuilder> {
  return new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
    new RoleSelectMenuBuilder()
      .setCustomId(`settings-channels:tag:role:${channelId}`)
      .setPlaceholder('Select a role to tag when notifications are sent')
      .setMinValues(1)
      .setMaxValues(1),
  );
}
