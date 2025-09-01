/** biome-ignore-all lint/complexity/noStaticOnlyClass: <explanation> */
import { type GlobalMessageData, GlobalMessageEntity } from '../../../../domain/entities/global-message.entity';
import { TableKey } from '../../../../domain/value-objects/table-key.vo';

/**
 * Global Message DynamoDB Mapper
 * Handles all mapping between domain entities and DynamoDB records
 * Centralizes mapping logic to eliminate duplication
 */
export class GlobalMessageMapper {
  /**
   * Map DynamoDB item to domain entity
   */
  static toDomain(item: Record<string, unknown>, guildId: string): GlobalMessageEntity {
    const data: GlobalMessageData = {
      messageId: item.messageId as string,
      guildId,
      lastUpdated: (item.lastUpdated as number) || Date.now(),
    };

    return GlobalMessageEntity.create(data);
  }

  /**
   * Map DynamoDB item to domain entity (when guild ID is in the PK)
   */
  static toDomainFromKeys(item: Record<string, unknown>): GlobalMessageEntity {
    const guildId = (item.PK as string).replace('GUILD#', '');
    return GlobalMessageMapper.toDomain(item, guildId);
  }

  /**
   * Map domain entity to DynamoDB item format
   */
  static toDatabase(entity: GlobalMessageEntity): Record<string, unknown> {
    const tableKey = TableKey.globalMessage(entity.guildId);

    return {
      ...tableKey.toDynamoKey(),
      Type: 'global_position_message',
      messageId: entity.messageId,
      lastUpdated: entity.lastUpdated,
    };
  }
}
