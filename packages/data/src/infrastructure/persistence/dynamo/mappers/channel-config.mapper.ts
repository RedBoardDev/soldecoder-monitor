/** biome-ignore-all lint/complexity/noStaticOnlyClass: mapper with only static methods */
import { type ChannelConfigData, ChannelConfigEntity } from '../../../../domain/entities/channel-config.entity';
import { TableKey } from '../../../../domain/value-objects/table-key.vo';

export class ChannelConfigMapper {
  static toDomain(item: Record<string, unknown>, channelId: string, guildId: string): ChannelConfigEntity {
    let tagType: 'user' | 'role' | null = null;
    if (item.tagType) {
      const tagTypeStr = (item.tagType as string).toLowerCase();
      if (tagTypeStr === 'user' || tagTypeStr === 'role') {
        tagType = tagTypeStr;
      }
    }

    const data: ChannelConfigData = {
      channelId,
      guildId,
      image: item.image as boolean,
      pin: item.pin as boolean,
      tagType,
      tagId: item.tagId as string | null,
      threshold: item.threshold as number | null,
      createdAt: (item.createdAt as number) || Date.now(),
    };

    return ChannelConfigEntity.create(data);
  }

  static toDomainFromKeys(item: Record<string, unknown>): ChannelConfigEntity {
    const channelId = (item.SK as string).replace('CHANNEL#', '');
    const guildId = (item.PK as string).replace('GUILD#', '');

    return ChannelConfigMapper.toDomain(item, channelId, guildId);
  }

  static toDatabase(entity: ChannelConfigEntity): Record<string, unknown> {
    const tableKey = TableKey.channelConfig(entity.guildId, entity.channelId);

    return {
      ...tableKey.toDynamoKey(),
      GSI_PK: `CHANNEL#${entity.channelId}`,
      GSI_SK: `GUILD#${entity.guildId}`,
      Type: 'channel_config',
      image: entity.image,
      pin: entity.pin,
      tagType: entity.tagType,
      tagId: entity.tagId,
      threshold: entity.threshold,
      createdAt: entity.createdAt,
    };
  }

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
