/** biome-ignore-all lint/complexity/noStaticOnlyClass: <explanation> */
import { type ChannelConfigData, ChannelConfigEntity } from '../../../../domain/entities/channel-config.entity';
import { TableKey } from '../../../../domain/value-objects/table-key.vo';

/**
 * Channel Configuration DynamoDB Mapper
 * Handles all mapping between domain entities and DynamoDB records
 * Centralizes mapping logic to eliminate duplication
 */
export class ChannelConfigMapper {
  /**
   * Map DynamoDB item to domain entity
   */
  static toDomain(item: Record<string, unknown>, channelId: string, guildId: string): ChannelConfigEntity {
    const data: ChannelConfigData = {
      channelId,
      guildId,
      image: item.image as boolean,
      notifyOnClose: item.notifyOnClose as boolean,
      pin: item.pin as boolean,
      tagType: item.tagType as 'user' | 'role' | null,
      tagId: item.tagId as string | null,
      threshold: item.threshold as number | null,
      createdAt: (item.createdAt as number) || Date.now(),
    };

    return ChannelConfigEntity.create(data);
  }

  /**
   * Map DynamoDB item to domain entity (when IDs are in the item keys)
   */
  static toDomainFromKeys(item: Record<string, unknown>): ChannelConfigEntity {
    const channelId = (item.SK as string).replace('CHANNEL#', '');
    const guildId = (item.PK as string).replace('GUILD#', '');

    return ChannelConfigMapper.toDomain(item, channelId, guildId);
  }

  /**
   * Map domain entity to DynamoDB item format
   */
  static toDatabase(entity: ChannelConfigEntity): Record<string, unknown> {
    const tableKey = TableKey.channelConfig(entity.guildId, entity.channelId);

    return {
      ...tableKey.toDynamoKey(),
      GSI_PK: `CHANNEL#${entity.channelId}`,
      GSI_SK: `GUILD#${entity.guildId}`,
      Type: 'channel_config',
      image: entity.image,
      notifyOnClose: entity.notifyOnClose,
      pin: entity.pin,
      tagType: entity.tagType,
      tagId: entity.tagId,
      threshold: entity.threshold,
      createdAt: entity.createdAt,
    };
  }

  /**
   * Create DynamoDB query expression for channel lookup
   */
  static createChannelQuery(channelId: string): {
    IndexName: string;
    KeyConditionExpression: string;
    ExpressionAttributeValues: Record<string, string>;
  } {
    return {
      IndexName: 'ChannelIndex',
      KeyConditionExpression: 'GSI_PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `CHANNEL#${channelId}`,
      },
    };
  }

  /**
   * Create DynamoDB filter expression for all channel configs
   */
  static createAllChannelConfigsFilter(): {
    FilterExpression: string;
    ExpressionAttributeNames: Record<string, string>;
    ExpressionAttributeValues: Record<string, string>;
  } {
    return {
      FilterExpression: '#type = :type',
      ExpressionAttributeNames: {
        '#type': 'Type',
      },
      ExpressionAttributeValues: {
        ':type': 'channel_config',
      },
    };
  }
}
