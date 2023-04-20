import { INotificationService } from './infrastructure/notifications/notificationService.interface';
import { TelegramNotificationService } from './infrastructure/notifications/telegramNotificationService';
import { SiteMapParser } from './infrastructure/parsers/sitemapParser';
import { ISiteMapParser } from './infrastructure/parsers/sitemapParser.interface';
import { EntriesRepository } from './infrastructure/repositories/entriesRepository';
import { IEntriesRepository } from './infrastructure/repositories/entriesRepository.interface';
import { Entry } from './models/entry';

const parser: ISiteMapParser = new SiteMapParser();
const repository: IEntriesRepository = new EntriesRepository();
const notificationService: INotificationService = new TelegramNotificationService();

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function notifyNewEntries(entries: Entry[]): Promise<void> {
  if (!entries?.length) {
    return Promise.resolve();
  }

  return notificationService.notifyNewEntries(entries);
}

async function getLastUpdatedDate(entry: Entry): Promise<number> {
  const dbEntry = await repository.getItem({ site: entry.site });
  return dbEntry?.updatedDate ?? 0;
}

export async function handler(): Promise<void> {
  try {
    console.log('Running...');
    const rootSitemapUrl = getEnvVar('ROOT_SITEMAP_URL');
    const entries = await parser.getSitemapEntries(rootSitemapUrl, true);
    console.log(`Found ${entries.length} entries in total`);

    if (!entries?.length) {
      console.log('cannot find any entries');
      return;
    }

    const firstEntry = entries[0];
    const lastUpdatedDate = await getLastUpdatedDate(firstEntry);
    const isUpdated = lastUpdatedDate <= firstEntry.updatedDate;
    if (!isUpdated) {
      console.log('sitemap is not updated');
      return;
    }

    const childEntries = await parser.getSitemapEntries(firstEntry.site, true);
    const newEntries = childEntries.filter((entry) => entry.updatedDate > lastUpdatedDate);
    console.log(`Found ${newEntries.length} new entries`);

    await notifyNewEntries(newEntries);
    await repository.saveItem(firstEntry);

    console.log('Done!');
  } catch (error) {
    console.error(JSON.stringify(error));
  }
}
