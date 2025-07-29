import { ScrapingService } from './ScrapingService';
import { IFeed, NewsSource } from '../types/Feed';
import { IFeedRepository } from '../repositories/FeedRepository';
import { Logger } from '../utils/logger';
import { BaseNewspaperExtractor } from '../extractors/BaseNewspaperExtractor';
import { NewspaperExtractorFactory } from '../extractors/NewspaperExtractorFactory';
import { ScrapingResult } from '../types/NewspaperTypes';

/**
 * Servicio principal de lectura de feeds mediante web scraping
 */
export class FeedReaderService {
  private scrapingService: ScrapingService;
  private extractors: Map<NewsSource, BaseNewspaperExtractor>;

  constructor(feedRepository: IFeedRepository) {
    this.scrapingService = new ScrapingService(feedRepository);
    this.extractors = new Map();
    this.initializeExtractors();
  }

  /**
   * Inicializa todos los extractores disponibles
   */
  private initializeExtractors(): void {
    const availableExtractors = NewspaperExtractorFactory.getAllAvailableExtractors();
    
    for (const extractor of availableExtractors) {
      this.extractors.set(extractor.getSource(), extractor);
      Logger.info(`Initialized extractor for ${extractor.getName()}`);
    }
  }

  /**
   * Extrae noticias de un periódico específico
   */
  async extractFromNewspaper(source: NewsSource): Promise<ScrapingResult> {
    const extractor = this.extractors.get(source);
    
    if (!extractor) {
      const error = `No extractor found for source: ${source}`;
      Logger.error(error);
      return {
        success: 0,
        failed: 1,
        duplicates: 0,
        items: [],
        errors: [error]
      };
    }

    if (!extractor.isEnabled()) {
      Logger.info(`Skipping disabled extractor: ${extractor.getName()}`);
      return {
        success: 0,
        failed: 0,
        duplicates: 0,
        items: [],
        errors: []
      };
    }

    try {
      Logger.info(`Starting extraction for ${extractor.getName()}`);
      const newsItems = await extractor.extractNews();
      
      if (newsItems.length === 0) {
        Logger.warn(`No news items extracted for ${extractor.getName()}`);
        return {
          success: 0,
          failed: 0,
          duplicates: 0,
          items: [],
          errors: []
        };
      }

      const results = await this.scrapingService.processFeedBatch(newsItems);
      const analyzed = this.analyzeResults(results);
      
      Logger.info(`Completed extraction for ${extractor.getName()}: ${analyzed.success} success, ${analyzed.failed} failed, ${analyzed.duplicates} duplicates`);
      return analyzed;
    } catch (error) {
      const errorMsg = `Error extracting from ${extractor.getName()}: ${error}`;
      Logger.error(errorMsg);
      return {
        success: 0,
        failed: 1,
        duplicates: 0,
        items: [],
        errors: [errorMsg]
      };
    }
  }

  /**
   * Extrae noticias de todos los periódicos disponibles
   */
  async extractFromAllNewspapers(): Promise<Map<NewsSource, ScrapingResult>> {
    Logger.info(`Starting batch extraction from ${this.extractors.size} newspapers`);
    const results = new Map<NewsSource, ScrapingResult>();

    for (const [source, extractor] of this.extractors) {
      if (extractor.isEnabled()) {
        const result = await this.extractFromNewspaper(source);
        results.set(source, result);
      } else {
        Logger.info(`Skipping disabled newspaper: ${extractor.getName()}`);
      }
    }

    const totalStats = this.calculateTotalStats(results);
    Logger.info(`Batch extraction completed: ${totalStats.success} total success, ${totalStats.failed} total failed, ${totalStats.duplicates} total duplicates`);
    
    return results;
  }

  /**
   * Obtiene la lista de periódicos disponibles
   */
  getAvailableNewspapers(): { source: NewsSource; name: string; enabled: boolean }[] {
    const newspapers: { source: NewsSource; name: string; enabled: boolean }[] = [];
    
    for (const [source, extractor] of this.extractors) {
      newspapers.push({
        source,
        name: extractor.getName(),
        enabled: extractor.isEnabled()
      });
    }
    
    return newspapers;
  }

  /**
   * Habilita o deshabilita un extractor específico
   */
  setExtractorEnabled(source: NewsSource, enabled: boolean): boolean {
    const extractor = this.extractors.get(source);
    if (!extractor) {
      Logger.error(`Cannot set enabled state: No extractor found for source ${source}`);
      return false;
    }

    // Nota: En una implementación real, esto podría modificar la configuración
    // Por ahora, solo registramos el cambio
    Logger.info(`${enabled ? 'Enabled' : 'Disabled'} extractor for ${extractor.getName()}`);
    return true;
  }

  /**
   * Analiza los resultados del procesamiento
   */
  private analyzeResults(results: (IFeed | null)[]): ScrapingResult {
    const success = results.filter(item => item !== null).length;
    const failed = results.filter(item => item === null).length;
    
    return {
      success,
      failed,
      duplicates: 0, // El ScrapingService maneja duplicados internamente
      items: results,
      errors: []
    };
  }

  /**
   * Calcula estadísticas totales de múltiples resultados
   */
  private calculateTotalStats(results: Map<NewsSource, ScrapingResult>): ScrapingResult {
    let totalSuccess = 0;
    let totalFailed = 0;
    let totalDuplicates = 0;
    const allItems: (IFeed | null)[] = [];
    const allErrors: string[] = [];

    for (const result of results.values()) {
      totalSuccess += result.success;
      totalFailed += result.failed;
      totalDuplicates += result.duplicates;
      allItems.push(...result.items);
      allErrors.push(...result.errors);
    }

    return {
      success: totalSuccess,
      failed: totalFailed,
      duplicates: totalDuplicates,
      items: allItems,
      errors: allErrors
    };
  }
}