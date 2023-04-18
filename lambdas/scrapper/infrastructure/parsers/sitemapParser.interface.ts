import { Entry } from '../../models/entry';

export interface ISiteMapParser {
  /**
   * Gets the sitemap entries.
   * @param sitemapUrl The sitemap URL.
   * @param recusive Indicates whether to recursively get nested sitemap entries.
   * @returns The sitemap entries.
   * @example
   * const entries = await getSitemapEntries('https://www.example.com/sitemap.xml', true);
   * console.log(`Found ${entries.length} entries in total`);
   */
  getSitemapEntries(sitemapUrl: string, recusive: boolean): Promise<Entry[]>;
}
