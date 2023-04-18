import {
  DeleteItemCommand,
  DeleteItemCommandInput,
  DynamoDBClient,
  GetItemCommand,
  GetItemCommandInput,
  PutItemCommand,
  PutItemCommandInput,
  QueryCommand,
  QueryCommandInput,
  ScanCommand,
  ScanCommandInput,
  UpdateItemCommand,
  UpdateItemCommandInput
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { ddbClient } from '../../clients/ddbClient';
import { Key, ReadRepository, Subset, WriteRepository } from './repository.interface';

const isNotEmptyObject = (obj: any): boolean => obj && typeof obj === 'object' && !Array.isArray(obj) && Object.keys(obj).length;

const flattenObject = (obj: any, prefix: string = ''): Record<string, any> =>
  Object.keys(obj).reduce((acc, k: string) => {
    const pre = prefix.length ? `${prefix}.` : '';
    const key = `${pre}${k}`;
    const value: any = obj[k];
    const entry = isNotEmptyObject(value) ? flattenObject(value, key) : { [key]: value };
    Object.assign(acc, entry);

    return acc;
  }, {});

/**
 * Handles operations on the Dynamo db table
 */
export class DynamoRepository<T extends object, K extends Key<T>> implements ReadRepository<T, K>, WriteRepository<T, K> {
  protected dynamoClient: DynamoDBClient;

  protected constructor(private readonly tableName: string) {
    this.dynamoClient = ddbClient;
  }

  /** @inheritdoc */
  public async saveItem(item: T): Promise<void> {
    const params: PutItemCommandInput = {
      TableName: this.tableName,
      Item: marshall(item)
    };

    await this.dynamoClient.send(new PutItemCommand(params));
    console.log(`Saved item to table ${this.tableName}`, item);
  }

  /** @inheritdoc */
  public async deleteItem(key: K): Promise<void> {
    const params: DeleteItemCommandInput = {
      TableName: this.tableName,
      Key: marshall(key)
    };

    await this.dynamoClient.send(new DeleteItemCommand(params));
    console.log(`Deleted item from table ${this.tableName}`, key);
  }

  /**
   * @inheritdoc
   *
   * WARNING: This method will not work if the item contains a nested object that is not present in the item to update.
   * For example, if the item to update is { name: 'John', address: { city: 'London' } } and the item in the database is { name: 'John', age: 30 },
   * the update will fail because the address object is not present in the item to update.
   * But if the item to update is { name: 'John', address: { city: 'London' } and the item in the database is { name: 'John', age: 30, address: { } },
   * the update will succeed because the address object is present in the item to update.
   */
  public async updateItem(key: K, item: Subset<T>): Promise<void> {
    const flattenedItem = flattenObject(item);
    const attributes: Record<string, string> = {};
    const values: Record<string, any> = {};
    const updateExpressions: string[] = [];
    const removeExpressions: string[] = [];

    Object.entries(flattenedItem).forEach(([key, value], idx) => {
      const keys = key.split('.');
      const keyDescriptor = keys.map((k) => `#${k}`).join('.');

      keys.forEach((k) => (attributes[`#${k}`] = k));

      if (value === undefined || value === null) {
        removeExpressions.push(keyDescriptor);
      } else {
        updateExpressions.push(`${keyDescriptor} = :val${idx}`);
        values[`:val${idx}`] = value;
      }
    });

    let updateExpression: string = '';
    updateExpression += updateExpressions.length ? ` SET ${updateExpressions.join(', ')}` : '';
    updateExpression += removeExpressions.length ? ` REMOVE ${removeExpressions.join(', ')}` : '';

    const params: UpdateItemCommandInput = {
      TableName: this.tableName,
      Key: marshall(key),
      UpdateExpression: updateExpression.trim(),
      ExpressionAttributeNames: attributes,
      ExpressionAttributeValues: marshall(values)
    };

    console.log(`Updating item in table ${this.tableName}`, { key, item, command: params });
    await this.dynamoClient.send(new UpdateItemCommand(params));
  }

  /** @inheritdoc */
  public async getItems(): Promise<T[]> {
    const params: ScanCommandInput = {
      TableName: this.tableName
    };

    const { Items } = await this.dynamoClient.send(new ScanCommand(params));
    console.log(`Retrieved items from table ${this.tableName}`, { numberFoundItems: Items?.length ?? 0 });
    return Items?.map((item: any) => unmarshall(item) as T) ?? [];
  }

  /** @inheritdoc */
  public async getItem(key: K): Promise<T | undefined> {
    const params: GetItemCommandInput = {
      TableName: this.tableName,
      Key: marshall(key)
    };

    console.log(`Retrieving item from table ${this.tableName}`, { key });
    const { Item } = await this.dynamoClient.send(new GetItemCommand(params));
    console.log(`Retrieved item from table ${this.tableName}`, Item);
    return Item ? (unmarshall(Item) as T) : undefined;
  }

  /**
   * Runs a query on the table
   * @param filters the filters to apply to the query
   * @returns {Promise<T[]>} a promise that resolves with the items
   * @throws {Error} if the items could not be retrieved
   * @example
   * const items = await repository.runQuery({ KeyConditionExpression: 'begins_with(name, :search)', ExpressionAttributeValues: { ':search': 'John' }, Limit: 1 });
   * console.log(items); // [{ id: '123', name: 'John Doe' }]
   */
  protected async runQuery(filters: Omit<QueryCommandInput, 'TableName'>): Promise<T[]> {
    const params: QueryCommandInput = { ...filters, TableName: this.tableName };
    const result: T[] = [];

    do {
      const { Items, LastEvaluatedKey } = await this.dynamoClient.send(new QueryCommand(params));
      result.push(...(Items?.map((item) => unmarshall(item) as T) ?? []));
      params.ExclusiveStartKey = LastEvaluatedKey;
    } while (params.ExclusiveStartKey);

    console.log('successfully queried items', { numberFoundItems: result.length });
    return result;
  }
}
