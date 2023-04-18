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

  public async getMaxUpdatedDate(): Promise<number> {
    const entries = await this.getItems();
    const lastUpdatedEntry = entries?.sort((a, b) => b.updatedDate - a.updatedDate)?.[0];
    const maxUpdatedDate = lastUpdatedEntry?.updatedDate ?? 0;
    console.log(`Max updated date: ${maxUpdatedDate}`);

    return maxUpdatedDate ?? 0;
  }
}
