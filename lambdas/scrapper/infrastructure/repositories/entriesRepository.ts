import { Entry } from '../../models/entry';
import { DynamoRepository } from './dynamoRepository';
import { EntryKey, IEntriesRepository } from './entriesRepository.interface';

export class EntriesRepository extends DynamoRepository<Entry, EntryKey> implements IEntriesRepository {
  constructor() {
    if (!process.env.ENTRIES_TABLE) {
      throw new Error('Missing environment variable ENTRIES_TABLE');
    }
    super(process.env.ENTRIES_TABLE);
  }

  public async getMaxUpdatedDate(): Promise<Date> {
    const entries = await this.runQuery({
      Limit: 1,
      ScanIndexForward: false
    });

    return entries?.[0]?.updatedDate ?? new Date(0);
  }
}
