import * as https from 'https';
import { parseStringPromise } from 'xml2js';
import { Entry } from '../../models/entry';
import { ISiteMapParser } from './sitemapParser.interface';

/**
 * XML sitemap parser implementation.
 */
export class SiteMapParser implements ISiteMapParser {
  /** @inheritdoc */
  public async getSitemapEntries(sitemapUrl: string, recusive: boolean): Promise<Entry[]> {
    console.log(`Downloading sitemap: ${sitemapUrl}`);
    const xmlContent = await this.downloadSitemap(sitemapUrl);

    const entries = await this.parseEntries(xmlContent);
    console.log(`Found ${entries.length} entries`);

    const nestedSitemapEntries = entries.filter((entry) => entry.site.endsWith('sitemap.xml'));
    if (!nestedSitemapEntries.length || !recusive) {
      return entries;
    }

    console.log(`Found ${nestedSitemapEntries.length} nested sitemaps`);
    const nestedEntries = await Promise.all(nestedSitemapEntries.map((entry) => this.getSitemapEntries(entry.site, true)));
    return entries.concat(...nestedEntries);
  }

  /**
   * Downloads the sitemap XML and returns it as a string.
   * @param sitemapUrl The sitemap URL.
   * @returns The sitemap XML.
   * @example
   * const xml = await downloadSitemap('https://www.example.com/sitemap.xml');
   * console.log(xml); // <?xml version="1.0" encoding="UTF-8"?>...
   */
  private async downloadSitemap(sitemapUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let xml: string = '';
      https
        .get(sitemapUrl, (res) => {
          res.on('data', (chunk) => (xml += chunk));
          res.on('end', () => resolve(xml));
        })
        .on('error', (err) => reject(err));
    });
  }

  /**
   * Parses the sitemap XML and returns the entries.
   * @param xmlContent The sitemap XML content.
   * @returns The sitemap entries.
   * @example
   * const entries = await parseEntries('<?xml version="1.0" encoding="UTF-8"?>...');
   * console.log(entries); // [{ site: 'https://www.example.com/', updatedDate: new Date('2020-01-01') }]
   */
  private async parseEntries(xmlContent: string): Promise<Entry[]> {
    const result = await parseStringPromise(xmlContent);
    const entries = result.urlset?.url ?? result.sitemapindex?.sitemap ?? result;
    return entries.map((url: any) => ({ site: url.loc[0], updatedDate: new Date(url.lastmod[0]).getTime() }));
  }
}
