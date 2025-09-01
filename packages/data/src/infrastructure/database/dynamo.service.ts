import type { UpdateItemCommandInput, UpdateItemCommandOutput } from '@aws-sdk/client-dynamodb';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import type {
  BatchWriteCommandInput,
  BatchWriteCommandOutput,
  DeleteCommandInput,
  GetCommandInput,
  GetCommandOutput,
  PutCommandInput,
  PutCommandOutput,
  QueryCommandInput,
  QueryCommandOutput,
  ScanCommandInput,
  ScanCommandOutput,
  UpdateCommandInput,
  UpdateCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import {
  BatchWriteCommand,
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { config } from '@soldecoder-monitor/config-env';

/**
 * DynamoDB service wrapper
 * Provides a clean interface to AWS DynamoDB operations
 */
export class DynamoService {
  private docClient: DynamoDBDocumentClient;

  constructor() {
    const credentials = {
      accessKeyId: config.aws.credentials.accessKeyId,
      secretAccessKey: config.aws.credentials.secretAccessKey,
    };

    const client = new DynamoDBClient({
      region: config.aws.region,
      credentials,
    });

    this.docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }

  create = (params: PutCommandInput): Promise<PutCommandOutput> => this.docClient.send(new PutCommand(params));

  get = (params: GetCommandInput): Promise<GetCommandOutput> => this.docClient.send(new GetCommand(params));

  query = (params: QueryCommandInput): Promise<QueryCommandOutput> => this.docClient.send(new QueryCommand(params));

  scan = (params: ScanCommandInput): Promise<ScanCommandOutput> => this.docClient.send(new ScanCommand(params));

  delete = (params: DeleteCommandInput): Promise<void> => this.docClient.send(new DeleteCommand(params)).then(() => {});

  batchWrite = (params: BatchWriteCommandInput): Promise<BatchWriteCommandOutput> =>
    this.docClient.send(new BatchWriteCommand(params));

  update = (params: UpdateCommandInput): Promise<UpdateCommandOutput> => this.docClient.send(new UpdateCommand(params));

  updateItem = (params: UpdateItemCommandInput): Promise<UpdateItemCommandOutput> =>
    this.docClient.send(new UpdateItemCommand(params));
}
