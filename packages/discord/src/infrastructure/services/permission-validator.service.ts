import {
  ChannelFeaturePermissionError,
  ChannelNotFoundError,
  InvalidChannelTypeError,
  MentionPermissionError,
} from '@discord/domain/errors/channel.errors';
import { BotPermissionError, ChannelAccessError } from '@discord/domain/errors/permission.errors';
import type { IPermissionValidator } from '@discord/domain/interfaces/permission-validator.interface';
import type { Guild } from 'discord.js';
import { ChannelType, PermissionFlagsBits } from 'discord.js';

export class PermissionValidatorService implements IPermissionValidator {
  async validateChannelAccess(guild: Guild, channelId: string): Promise<void> {
    // Get the channel from guild
    const channel = guild.channels.cache.get(channelId);
    if (!channel) {
      throw new ChannelNotFoundError(channelId);
    }

    // Check if it's a text channel
    if (channel.type !== ChannelType.GuildText) {
      throw new InvalidChannelTypeError(channelId, ChannelType[channel.type], channel.name);
    }

    // Get bot member
    const botMember = guild.members.me;
    if (!botMember) {
      throw new ChannelAccessError(channelId, channel.name, 'Bot not found in guild');
    }

    const permissions = botMember.permissionsIn(channel);
    const missingPermissions: string[] = [];

    if (!permissions.has(PermissionFlagsBits.ViewChannel)) {
      missingPermissions.push('View Channel');
    }

    if (!permissions.has(PermissionFlagsBits.SendMessages)) {
      missingPermissions.push('Send Messages');
    }

    if (missingPermissions.length > 0) {
      throw new BotPermissionError(missingPermissions, channelId, channel.name);
    }
  }

  async validateChannelPermissions(guild: Guild, channelId: string, permissionNames: string[]): Promise<void> {
    // Get the channel from guild
    const channel = guild.channels.cache.get(channelId);
    if (!channel) {
      throw new ChannelNotFoundError(channelId);
    }

    // Get bot member
    const botMember = guild.members.me;
    if (!botMember) {
      throw new ChannelAccessError(channelId, channel.name, 'Bot not found in guild');
    }

    // Check permissions
    const permissions = botMember.permissionsIn(channel);
    const missingPermissions: string[] = [];

    for (const permissionName of permissionNames) {
      const permission = this.getPermissionFlag(permissionName);
      if (permission && !permissions.has(permission)) {
        missingPermissions.push(permissionName);
      }
    }

    if (missingPermissions.length > 0) {
      throw new BotPermissionError(missingPermissions, channelId, channel.name);
    }
  }

  private getPermissionFlag(permissionName: string): bigint | null {
    const permissionMap: Record<string, bigint> = {
      'View Channel': PermissionFlagsBits.ViewChannel,
      'Send Messages': PermissionFlagsBits.SendMessages,
      'Manage Messages': PermissionFlagsBits.ManageMessages,
      'Attach Files': PermissionFlagsBits.AttachFiles,
      'Embed Links': PermissionFlagsBits.EmbedLinks,
      'Read Message History': PermissionFlagsBits.ReadMessageHistory,
      'Add Reactions': PermissionFlagsBits.AddReactions,
    };

    return permissionMap[permissionName] || null;
  }

  async validatePinFeature(guild: Guild, channelId: string): Promise<void> {
    // Get the channel from guild
    const channel = guild.channels.cache.get(channelId);
    if (!channel) {
      throw new ChannelNotFoundError(channelId);
    }

    // Get bot member
    const botMember = guild.members.me;
    if (!botMember) {
      throw new ChannelAccessError(channelId, channel.name, 'Bot not found in guild');
    }

    // Check pin permissions
    const permissions = botMember.permissionsIn(channel);
    const missingPermissions: string[] = [];

    if (!permissions.has(PermissionFlagsBits.ManageMessages)) {
      missingPermissions.push('Manage Messages');
    }

    if (missingPermissions.length > 0) {
      throw new ChannelFeaturePermissionError('Auto-Pin', missingPermissions, channelId, channel.name);
    }
  }

  async validateImageFeature(guild: Guild, channelId: string): Promise<void> {
    // Get the channel from guild
    const channel = guild.channels.cache.get(channelId);
    if (!channel) {
      throw new ChannelNotFoundError(channelId);
    }

    // Get bot member
    const botMember = guild.members.me;
    if (!botMember) {
      throw new ChannelAccessError(channelId, channel.name, 'Bot not found in guild');
    }

    // Check image permissions
    const permissions = botMember.permissionsIn(channel);
    const missingPermissions: string[] = [];

    if (!permissions.has(PermissionFlagsBits.AttachFiles)) {
      missingPermissions.push('Attach Files');
    }

    if (!permissions.has(PermissionFlagsBits.SendMessages)) {
      missingPermissions.push('Send Messages');
    }

    if (missingPermissions.length > 0) {
      throw new ChannelFeaturePermissionError('Position Images', missingPermissions, channelId, channel.name);
    }
  }

  async validateNotificationFeature(guild: Guild, channelId: string): Promise<void> {
    // Get the channel from guild
    const channel = guild.channels.cache.get(channelId);
    if (!channel) {
      throw new ChannelNotFoundError(channelId);
    }

    // Get bot member
    const botMember = guild.members.me;
    if (!botMember) {
      throw new ChannelAccessError(channelId, channel.name, 'Bot not found in guild');
    }

    // Check notification permissions
    const permissions = botMember.permissionsIn(channel);
    const missingPermissions: string[] = [];

    if (!permissions.has(PermissionFlagsBits.SendMessages)) {
      missingPermissions.push('Send Messages');
    }

    if (!permissions.has(PermissionFlagsBits.EmbedLinks)) {
      missingPermissions.push('Embed Links');
    }

    if (missingPermissions.length > 0) {
      throw new ChannelFeaturePermissionError('Close Notifications', missingPermissions, channelId, channel.name);
    }
  }

  async validateMentionFeature(guild: Guild, channelId: string, mentionType: 'USER' | 'ROLE'): Promise<void> {
    // Get the channel from guild
    const channel = guild.channels.cache.get(channelId);
    if (!channel) {
      throw new ChannelNotFoundError(channelId);
    }

    // Get bot member
    const botMember = guild.members.me;
    if (!botMember) {
      throw new ChannelAccessError(channelId, channel.name, 'Bot not found in guild');
    }

    // Check mention permissions
    const permissions = botMember.permissionsIn(channel);
    const missingPermissions: string[] = [];

    if (!permissions.has(PermissionFlagsBits.SendMessages)) {
      missingPermissions.push('Send Messages');
    }

    // For role mentions, we might need Mention Everyone in some cases
    // But we'll handle this gracefully by just checking basic send permissions
    if (missingPermissions.length > 0) {
      throw new MentionPermissionError(mentionType, channelId, channel.name);
    }
  }
}
