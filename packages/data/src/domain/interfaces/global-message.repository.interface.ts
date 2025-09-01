import type { GlobalMessageEntity } from '../entities/global-message.entity';

/**
 * Global Message repository interface
 */
export interface GlobalMessageRepository {
  /**
   * Get global message for a guild
   */
  getGlobalMessage(guildId: string): Promise<GlobalMessageEntity | null>;

  /**
   * Get only the message ID for a guild
   */
  getGlobalMessageId(guildId: string): Promise<string | null>;

  /**
   * Save global message for a guild
   */
  saveGlobalMessage(guildId: string, messageId: string): Promise<void>;

  /**
   * Delete global message for a guild
   */
  deleteGlobalMessage(guildId: string): Promise<void>;
}
