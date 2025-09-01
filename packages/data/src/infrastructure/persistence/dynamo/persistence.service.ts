import type {
  DeleteCommandInput,
  GetCommandInput,
  GetCommandOutput,
  PutCommandInput,
  QueryCommandInput,
  QueryCommandOutput,
  ScanCommandInput,
  ScanCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import { DynamoService } from '../../database/dynamo.service';
import { config } from '@soldecoder-monitor/config-env';
import { createFeatureLogger } from '@soldecoder-monitor/logger';
import { PersistenceError } from '../../../domain/errors/data.errors';
import { TableKey } from '../../../domain/value-objects/table-key.vo';

const logger = createFeatureLogger('persistence');

/**
 * Pure persistence service for DynamoDB operations
 * NO domain logic, NO mapping - only raw database operations
 * Clean separation between infrastructure and domain concerns
 */
export class DynamoPersistenceService {
  private readonly dynamoService: DynamoService;
  private readonly tableName: string;

  constructor() {
    this.dynamoService = new DynamoService();
    this.tableName = config.aws.tables.config;
  }

  // ============= RAW DATABASE OPERATIONS =============

  /**
   * Get item by table key
   */
  async getItem(tableKey: TableKey): Promise<Record<string, unknown> | null> {
    try {
      const params: GetCommandInput = {
        TableName: this.tableName,
        Key: tableKey.toDynamoKey(),
      };

      const result: GetCommandOutput = await this.dynamoService.get(params);
      return result.Item || null;
    } catch (error) {
      logger.error('Failed to get item', error as Error, { tableKey: tableKey.toDynamoKey() });
      throw new PersistenceError('get', (error as Error).message, { tableKey: tableKey.toDynamoKey() });
    }
  }

  /**
   * Query items with parameters
   */
  async queryItems(queryParams: Omit<QueryCommandInput, 'TableName'>): Promise<Record<string, unknown>[]> {
    try {
      const params: QueryCommandInput = {
        TableName: this.tableName,
        ...queryParams,
      };

      const result: QueryCommandOutput = await this.dynamoService.query(params);
      return result.Items || [];
    } catch (error) {
      logger.error('Failed to query items', error as Error, { queryParams });
      throw new PersistenceError('query', (error as Error).message, { queryParams });
    }
  }

  /**
   * Scan table with filter
   */
  async scanItems(scanParams: Omit<ScanCommandInput, 'TableName'>): Promise<Record<string, unknown>[]> {
    try {
      const params: ScanCommandInput = {
        TableName: this.tableName,
        ...scanParams,
      };

      const result: ScanCommandOutput = await this.dynamoService.scan(params);
      return result.Items || [];
    } catch (error) {
      logger.error('Failed to scan items', error as Error, { scanParams });
      throw new PersistenceError('scan', (error as Error).message, { scanParams });
    }
  }

  /**
   * Put item to table
   */
  async putItem(item: Record<string, unknown>): Promise<void> {
    try {
      const params: PutCommandInput = {
        TableName: this.tableName,
        Item: item,
      };

      await this.dynamoService.create(params);
    } catch (error) {
      logger.error('Failed to put item', error as Error, { item });
      throw new PersistenceError('put', (error as Error).message, { item });
    }
  }

  /**
   * Delete item by table key
   */
  async deleteItem(tableKey: TableKey): Promise<void> {
    try {
      const params: DeleteCommandInput = {
        TableName: this.tableName,
        Key: tableKey.toDynamoKey(),
      };

      await this.dynamoService.delete(params);
    } catch (error) {
      logger.error('Failed to delete item', error as Error, { tableKey: tableKey.toDynamoKey() });
      throw new PersistenceError('delete', (error as Error).message, { tableKey: tableKey.toDynamoKey() });
    }
  }

  // ============= SPECIALIZED OPERATIONS =============

  /**
   * Get channel config by channel ID (uses GSI)
   */
  async getChannelConfigByChannelId(channelId: string): Promise<Record<string, unknown> | null> {
    const items = await this.queryItems({
      IndexName: 'ChannelIndex',
      KeyConditionExpression: 'GSI_PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `CHANNEL#${channelId}`,
      },
    });

    return items.length > 0 ? items[0] : null;
  }

  /**
   * Get all items of a specific type
   */
  async getAllItemsByType(entityType: string): Promise<Record<string, unknown>[]> {
    return this.scanItems({
      FilterExpression: '#type = :type',
      ExpressionAttributeNames: {
        '#type': 'Type',
      },
      ExpressionAttributeValues: {
        ':type': entityType,
      },
    });
  }

  /**
   * Get guild settings
   */
  async getGuildSettings(guildId: string): Promise<Record<string, unknown> | null> {
    const tableKey = TableKey.guildSettings(guildId);
    return this.getItem(tableKey);
  }

  /**
   * Get global message
   */
  async getGlobalMessage(guildId: string): Promise<Record<string, unknown> | null> {
    const tableKey = TableKey.globalMessage(guildId);
    return this.getItem(tableKey);
  }
}
