import * as crypto from 'node:crypto';
import { DynamoGlobalMessageRepository, type GlobalMessageRepository } from '@soldecoder-monitor/data';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import type { Client } from 'discord.js';
import { buildGlobalPositionsEmbed } from '../../../discord/ui/global-positions.embed';
import type { PositionStatus } from '../../domain/value-objects/position-status.vo';
import { createMessage, getTextChannel, tryUpdateMessage } from '../helpers/discord-message.helper';

const logger = createFeatureLogger('global-message-update-service');

/**
 * Service for managing global position message updates.
 * Simplified service focused on coordinating message updates.
 */
export class GlobalMessageUpdateService {
  private readonly MESSAGE_MAX_AGE_DAYS = 6;

  constructor(private readonly globalMessageRepository: GlobalMessageRepository) {}

  static create(): GlobalMessageUpdateService {
    const repository = DynamoGlobalMessageRepository.create();
    return new GlobalMessageUpdateService(repository);
  }

  /**
   * Update or create a global position message for a guild
   */
  async updateGlobalMessage(
    client: Client,
    guildId: string,
    globalChannelId: string,
    positionsByWallet: Map<string, PositionStatus[]>,
  ): Promise<void> {
    try {
      const textChannel = getTextChannel(client, globalChannelId);
      if (!textChannel) {
        logger.warn('Global channel not found or not accessible', { guildId, globalChannelId });
        return;
      }

      const embed = this.buildScheduledEmbed(positionsByWallet);
      const existingMessageId = await this.globalMessageRepository.getGlobalMessageId(guildId);

      // Try to update existing message first
      if (existingMessageId) {
        const updated = await tryUpdateMessage(textChannel, existingMessageId, embed, this.MESSAGE_MAX_AGE_DAYS);
        if (updated) {
          return;
        }
      }

      // Create new message if update failed or no existing message
      const newMessage = await createMessage(textChannel, embed);
      await this.globalMessageRepository.saveGlobalMessage(guildId, newMessage.id);

      logger.debug('Global message updated successfully', { guildId, messageId: newMessage.id });
    } catch (error) {
      logger.error('Failed to update global message', error as Error, { guildId, globalChannelId });
    }
  }

  /**
   * Build embed for scheduled updates
   */
  private buildScheduledEmbed(positionsByWallet: Map<string, PositionStatus[]>) {
    const updateId = crypto.randomBytes(3).toString('hex');
    return buildGlobalPositionsEmbed({
      positionsByWallet,
      percentOnly: false,
      footerText: 'Auto-updated every 30s - ',
      updateId,
    });
  }
}
