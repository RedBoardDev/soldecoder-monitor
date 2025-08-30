import type { Guild } from 'discord.js';

/**
 * Interface for validating bot permissions in Discord
 */
export interface IPermissionValidator {
  /**
   * Validates if bot can access and send messages to a channel
   * @param guild Discord guild
   * @param channelId Channel ID to validate
   * @returns Promise<void> - throws error if validation fails
   */
  validateChannelAccess(guild: Guild, channelId: string): Promise<void>;

  /**
   * Validates if bot has specific permissions in a channel
   * @param guild Discord guild
   * @param channelId Channel ID to validate
   * @param permissions Array of permission names to check
   * @returns Promise<void> - throws error if validation fails
   */
  validateChannelPermissions(guild: Guild, channelId: string, permissions: string[]): Promise<void>;

  /**
   * Validates if bot can use pin feature in a channel
   * @param guild Discord guild
   * @param channelId Channel ID to validate
   * @returns Promise<void> - throws error if validation fails
   */
  validatePinFeature(guild: Guild, channelId: string): Promise<void>;

  /**
   * Validates if bot can use image/attachment feature in a channel
   * @param guild Discord guild
   * @param channelId Channel ID to validate
   * @returns Promise<void> - throws error if validation fails
   */
  validateImageFeature(guild: Guild, channelId: string): Promise<void>;

  /**
   * Validates if bot can use notification feature in a channel
   * @param guild Discord guild
   * @param channelId Channel ID to validate
   * @returns Promise<void> - throws error if validation fails
   */
  validateNotificationFeature(guild: Guild, channelId: string): Promise<void>;

  /**
   * Validates if bot can use mention feature in a channel
   * @param guild Discord guild
   * @param channelId Channel ID to validate
   * @param mentionType Type of mention (USER or ROLE)
   * @returns Promise<void> - throws error if validation fails
   */
  validateMentionFeature(guild: Guild, channelId: string, mentionType: 'USER' | 'ROLE'): Promise<void>;
}
