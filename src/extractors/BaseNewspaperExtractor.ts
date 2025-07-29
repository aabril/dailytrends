import { WebScraper } from '../utils/WebScraper';
import { IFeed, NewsSource } from '../types/Feed';
import { NewspaperConfig } from '../types/NewspaperTypes';
import { Logger } from '../utils/logger';

/**
 * Clase abstracta base para extractores de periódicos
 */
export abstract class BaseNewspaperExtractor {
  protected webScraper: WebScraper;
  protected config: NewspaperConfig;

  constructor(config: NewspaperConfig) {
    this.webScraper = new WebScraper();
    this.config = config;
  }

  /**
   * Método abstracto que debe implementar cada extractor específico
   */
  abstract extractFrontPageUrls(): Promise<string[]>;

  /**
   * Extrae noticias de las URLs de portada
   */
  async extractNews(): Promise<Omit<IFeed, '_id' | 'createdAt' | 'updatedAt'>[]> {
    try {
      Logger.info(`Extracting front page URLs for ${this.config.name}`);
      const urls = await this.extractFrontPageUrls();
      
      if (urls.length === 0) {
        Logger.warn(`No URLs found for ${this.config.name}`);
        return [];
      }

      Logger.info(`Found ${urls.length} articles for ${this.config.name}`);
      const newsItems: Omit<IFeed, '_id' | 'createdAt' | 'updatedAt'>[] = [];

      for (const url of urls) {
        try {
          const scrapedData = await this.webScraper.scrapeUrl(url);
          if (scrapedData) {
            const feedItem = this.webScraper.convertToFeedData(scrapedData, this.config.source);
            newsItems.push(feedItem);
          }
        } catch (error) {
          Logger.error(`Error scraping article ${url}:`, error);
        }
      }

      return newsItems;
    } catch (error) {
      Logger.error(`Error extracting news for ${this.config.name}:`, error);
      return [];
    }
  }

  /**
   * Verifica si el extractor está habilitado
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Obtiene el nombre del periódico
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * Obtiene la fuente del periódico
   */
  getSource(): NewsSource {
    return this.config.source;
  }
}