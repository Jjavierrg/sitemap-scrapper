import { Entry } from '../../models/entry';

export interface INotificationService {
  /**
   * Notifies new entries to the user
   */
  notifyNewEntries(entries: Entry[]): Promise<void>;
}
