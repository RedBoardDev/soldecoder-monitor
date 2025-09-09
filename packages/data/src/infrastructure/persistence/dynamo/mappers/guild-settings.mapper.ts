/** biome-ignore-all lint/complexity/noStaticOnlyClass: <explanation> */
import { type GuildSettingsData, GuildSettingsEntity } from '../../../../domain/entities/guild-settings.entity';
import { TableKey } from '../../../../domain/value-objects/table-key.vo';

export class GuildSettingsMapper {
  static toDomain(item: Record<string, unknown>, guildId: string): GuildSettingsEntity {
    const data: GuildSettingsData = {
      guildId,
      positionDisplayEnabled: (item.positionDisplayEnabled as boolean) ?? true,
      globalChannelId: (item.globalChannelId as string) || null,
      timezone: (item.timezone as string) || 'UTC',
      forward: (item.forward as boolean) ?? true,
      autoDeleteWarnings: (item.autoDeleteWarnings as boolean) ?? false,
      summaryPreferences: (item.summaryPreferences as any) || {
        dailySummary: false,
        weeklySummary: false,
        monthlySummary: false,
      },
      positionSizeDefaults: (item.positionSizeDefaults as any) || {
        walletAddress: null,
        stopLossPercent: null,
      },
      createdAt: (item.createdAt as number) || Date.now(),
    };

    return GuildSettingsEntity.create(data);
  }

  static toDomainFromKeys(item: Record<string, unknown>): GuildSettingsEntity {
    const guildId = (item.PK as string).replace('GUILD#', '');
    return GuildSettingsMapper.toDomain(item, guildId);
  }

  static toDatabase(entity: GuildSettingsEntity): Record<string, unknown> {
    const tableKey = TableKey.guildSettings(entity.guildId);

    return {
      ...tableKey.toDynamoKey(),
      Type: 'guild_settings',
      positionDisplayEnabled: entity.positionDisplayEnabled,
      globalChannelId: entity.globalChannelId,
      timezone: entity.timezone,
      forward: entity.forward,
      autoDeleteWarnings: entity.autoDeleteWarnings,
      summaryPreferences: entity.summaryPreferences,
      positionSizeDefaults: entity.positionSizeDefaults,
      createdAt: entity.createdAt,
    };
  }

  static createAllGuildSettingsFilter(): {
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
        ':type': 'guild_settings',
      },
    };
  }
}
