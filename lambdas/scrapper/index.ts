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

async function saveNewEntries(entries: Entry[]): Promise<void> {
  if (!entries?.length) {
    return;
  }

  for (const entry of entries) {
    await repository.saveItem(entry);
  }
}

function notifyNewEntries(entries: Entry[]): Promise<void> {
  if (!entries?.length) {
    return Promise.resolve();
  }

  return notificationService.notifyNewEntries(entries);
}

export async function handler(): Promise<void> {
  try {
    console.log('Running...');
    const rootSitemapUrl = getEnvVar('ROOT_SITEMAP_URL');
    const entries = await parser.getSitemapEntries(rootSitemapUrl, true);
    console.log(`Found ${entries.length} entries in total`);

    const maxUpdatedDate = await repository.getMaxUpdatedDate();
    console.log(`Max updated date: ${maxUpdatedDate}`);

    const newEntries = entries.filter((entry) => entry.updatedDate > maxUpdatedDate);
    console.log(`Found ${newEntries.length} new entries`);

    await saveNewEntries(newEntries);
    await notifyNewEntries(newEntries);

    console.log('Done!');
  } catch (error) {
    console.error(JSON.stringify(error));
  }
}
