import { WebScraper } from '../utils/WebScraper.js';
import { ScrapingService } from './ScrapingService.js';
import { IFeed, NewsSource } from '../types/Feed.js';
import { IFeedRepository } from '../repositories/FeedRepository.js';
import { Logger } from '../utils/logger.js';

interface ScrapingResult {
  success: number;
  failed: number;
  duplicates: number;
  items: (IFeed | null)[];
}

interface NewsSourceConfig {
  name: string;
  source: NewsSource;
  webUrls?: string[];
  enabled: boolean;
}

export class ContentScrapingService {
  private webScraper: WebScraper;
  private scrapingService: ScrapingService;

  constructor(feedRepository: IFeedRepository) {
    this.webScraper = new WebScraper();
    this.scrapingService = new ScrapingService(feedRepository);
  }



  async scrapeFromWebUrls(urls: string[], source: NewsSource): Promise<ScrapingResult> {
    Logger.info(`Starting web scraping from ${urls.length} URLs for ${source}`);
    
    // Functional approach: parallel processing with Promise.all and map
    const scrapingPromises = urls.map(async (url) => {
      try {
        const scrapedData = await this.webScraper.scrapeUrl(url);
        return scrapedData ? this.webScraper.convertToFeedData(scrapedData, source) : null;
      } catch (error) {
        Logger.error(`Error scraping URL ${url}:`, error);
        return null;
      }
    });

    const scrapingResults = await Promise.all(scrapingPromises);
    const feedItems = scrapingResults.filter((item): item is Omit<IFeed, '_id' | 'createdAt' | 'updatedAt'> => item !== null);

    if (feedItems.length === 0) {
      Logger.warn(`No items scraped from web URLs`);
      return { success: 0, failed: urls.length, duplicates: 0, items: [] };
    }

    const results = await this.scrapingService.processFeedBatch(feedItems);
    return this.analyzeResults(results);
  }

  async scrapeFromSource(config: NewsSourceConfig): Promise<ScrapingResult> {
    if (!config.enabled) {
      Logger.info(`Skipping disabled source: ${config.name}`);
      return { success: 0, failed: 0, duplicates: 0, items: [] };
    }

    Logger.info(`Starting content scraping for source: ${config.name}`);
    
    let totalResult: ScrapingResult = { success: 0, failed: 0, duplicates: 0, items: [] };

    // Scrape from web URLs if available
    if (config.webUrls && config.webUrls.length > 0) {
      const webResult = await this.scrapeFromWebUrls(config.webUrls, config.source);
      totalResult = this.mergeResults(totalResult, webResult);
    }

    Logger.info(`Completed scraping for ${config.name}: ${totalResult.success} success, ${totalResult.failed} failed, ${totalResult.duplicates} duplicates`);
    return totalResult;
  }

  async scrapeFromMultipleSources(configs: NewsSourceConfig[]): Promise<Map<string, ScrapingResult>> {
    Logger.info(`Starting batch scraping from ${configs.length} sources`);
    
    // Functional approach: parallel processing with Promise.all and map
    const scrapingPromises = configs.map(async (config): Promise<[string, ScrapingResult]> => {
      try {
        const result = await this.scrapeFromSource(config);
        return [config.name, result];
      } catch (error) {
        Logger.error(`Error scraping source ${config.name}:`, error);
        return [config.name, { success: 0, failed: 1, duplicates: 0, items: [] }];
      }
    });

    const resultEntries = await Promise.all(scrapingPromises);
    const results = new Map(resultEntries);

    const totalStats = this.calculateTotalStats(results);
    Logger.info(`Batch scraping completed: ${totalStats.success} total success, ${totalStats.failed} total failed, ${totalStats.duplicates} total duplicates`);
    
    return results;
  }

  private analyzeResults(results: (IFeed | null)[]): ScrapingResult {
    const success = results.filter(item => item !== null).length;
    const duplicates = results.filter(item => item === null).length;
    
    return {
      success,
      failed: 0, // processFeedBatch doesn't fail individual items, it throws on repository errors
      duplicates,
      items: results
    };
  }

  private mergeResults(result1: ScrapingResult, result2: ScrapingResult): ScrapingResult {
    return {
      success: result1.success + result2.success,
      failed: result1.failed + result2.failed,
      duplicates: result1.duplicates + result2.duplicates,
      items: [...result1.items, ...result2.items]
    };
  }

  private calculateTotalStats(results: Map<string, ScrapingResult>): ScrapingResult {
    let totalSuccess = 0;
    let totalFailed = 0;
    let totalDuplicates = 0;
    const allItems: (IFeed | null)[] = [];

    for (const result of results.values()) {
      totalSuccess += result.success;
      totalFailed += result.failed;
      totalDuplicates += result.duplicates;
      allItems.push(...result.items);
    }

    return {
      success: totalSuccess,
      failed: totalFailed,
      duplicates: totalDuplicates,
      items: allItems
    };
  }

  // Utility method to create common news source configurations
  static createNewsSourceConfigs(): NewsSourceConfig[] {
    return [
      {
        name: 'El País',
        source: NewsSource.EL_PAIS,
        enabled: true
      },
      {
        name: 'El Mundo',
        source: NewsSource.EL_MUNDO,
        enabled: true
      }
    ];
  }
}