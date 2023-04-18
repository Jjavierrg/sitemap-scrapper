import { Entry } from '../../models/entry';
import { ReadRepository, WriteRepository } from './repository.interface';

export type EntryKey = Pick<Entry, 'site'>;
export interface IEntriesRepository extends ReadRepository<Entry, EntryKey>, WriteRepository<Entry, EntryKey> {
  getMaxUpdatedDate(): Promise<number>;
}
