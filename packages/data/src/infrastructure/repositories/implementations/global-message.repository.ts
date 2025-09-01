import type { GlobalMessageEntity } from '../../../domain/entities/global-message.entity';
import { GlobalMessageEntity as GlobalMessage } from '../../../domain/entities/global-message.entity';
import type { GlobalMessageRepository } from '../../../domain/interfaces/global-message.repository.interface';
import { CacheKey } from '../../../domain/value-objects/cache-key.vo';
import { DatabaseService } from '../../persistence/dynamo/database.service';
import { CachedRepositoryBase } from '../base/cached-repository.base';

/**
 * DynamoDB implementation of GlobalMessageRepository with intelligent caching
 * Clean architecture with dependency injection and zero code duplication
 */
export class DynamoGlobalMessageRepository extends CachedRepositoryBase implements GlobalMessageRepository {
  constructor(private readonly databaseService: DatabaseService) {
    super();
  }

  /**
   * Factory method with default dependencies
   */
  static create(): DynamoGlobalMessageRepository {
    return new DynamoGlobalMessageRepository(DatabaseService.create());
  }

  async getGlobalMessageId(guildId: string): Promise<string | null> {
    const message = await this.getGlobalMessage(guildId);
    return message ? message.messageId : null;
  }

  async getGlobalMessage(guildId: string): Promise<GlobalMessageEntity | null> {
    const cacheKey = CacheKey.globalMessage(guildId).getValue();

    return this.cachedGet(cacheKey, () => this.databaseService.getGlobalMessage(guildId), {
      guildId,
      operation: 'getGlobalMessage',
    });
  }

  async saveGlobalMessage(guildId: string, messageId: string): Promise<void> {
    const cacheKey = CacheKey.globalMessage(guildId).getValue();

    // Create the message entity to cache (ensuring consistent entity usage)
    const globalMessage = GlobalMessage.createNew(messageId, guildId);

    await this.cachedSave(cacheKey, globalMessage, () => this.databaseService.saveGlobalMessage(guildId, messageId), {
      guildId,
      messageId,
      operation: 'saveGlobalMessage',
    });
  }

  async deleteGlobalMessage(guildId: string): Promise<void> {
    const cacheKey = CacheKey.globalMessage(guildId).getValue();

    await this.cachedDelete(cacheKey, () => this.databaseService.deleteGlobalMessage(guildId), {
      guildId,
      operation: 'deleteGlobalMessage',
    });
  }
}
