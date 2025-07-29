import { BaseNewspaperExtractor } from './BaseNewspaperExtractor';
import { ElPaisExtractor } from './ElPaisExtractor';
import { ElMundoExtractor } from './ElMundoExtractor';
import { NewsSource } from '../types/Feed';
import { Logger } from '../utils/logger';

/**
 * Factory para crear extractores de periódicos
 */
export class NewspaperExtractorFactory {
  static createExtractor(source: NewsSource): BaseNewspaperExtractor | null {
    switch (source) {
      case NewsSource.EL_PAIS:
        return new ElPaisExtractor();
      case NewsSource.EL_MUNDO:
        return new ElMundoExtractor();
      default:
        Logger.warn(`No extractor available for source: ${source}`);
        return null;
    }
  }

  static getAllAvailableExtractors(): BaseNewspaperExtractor[] {
    const extractors: BaseNewspaperExtractor[] = [];
    
    for (const source of Object.values(NewsSource)) {
      if (source !== NewsSource.MANUAL) {
        const extractor = this.createExtractor(source);
        if (extractor) {
          extractors.push(extractor);
        }
      }
    }
    
    return extractors;
  }
}