import { BaseNewspaperExtractor } from './BaseNewspaperExtractor';
import { NewsSource } from '../types/Feed';
import { Logger } from '../utils/logger';

/**
 * Extractor específico para El Mundo
 */
export class ElMundoExtractor extends BaseNewspaperExtractor {
  constructor() {
    super({
      name: 'El Mundo',
      source: NewsSource.EL_MUNDO,
      baseUrl: 'https://elmundo.es',
      frontPageUrl: 'https://elmundo.es',
      selectors: {
        articleLinks: '.ue-c-cover-content__link, .ue-c-cover-content__headline-link, h2 a, h3 a',
        titleSelector: 'h1, .ue-c-article__headline',
        descriptionSelector: '.ue-c-article__standfirst, .ue-c-cover-content__standfirst',
        dateSelector: '.ue-c-article__publishdate, time',
        imageSelector: '.ue-c-article__image img'
      },
      enabled: true
    });
  }

  async extractFrontPageUrls(): Promise<string[]> {
    // Obtener HTML directamente usando fetch
    const response = await fetch(this.config.frontPageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DailyTrends/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      Logger.error(`Failed to fetch ${this.config.frontPageUrl}: ${response.status}`);
      return [];
    }

    const html = await response.text();
    if (!html) {
      return [];
    }

    try {
      // Extraer enlaces de artículos usando regex
      const linkRegex = /<a[^>]+href=["']([^"']*(?:elmundo\.es)?[^"']*)["'][^>]*>.*?<\/a>/gi;
      const urls: string[] = [];
      let match;

      while ((match = linkRegex.exec(html)) !== null) {
        let url = match[1];
        
        // Filtrar solo URLs de artículos relevantes
        if (url.includes('/espana/') || 
            url.includes('/internacional/') || 
            url.includes('/economia/') ||
            url.includes('/sociedad/') ||
            url.includes('/politica/')) {
          
          // Convertir URLs relativas a absolutas
          if (url.startsWith('/')) {
            url = this.config.baseUrl + url;
          }
          
          if (!urls.includes(url) && urls.length < 20) {
            urls.push(url);
          }
        }
      }

      return urls;
    } catch (error) {
      Logger.error(`Error extracting El Mundo URLs:`, error);
      return [];
    }
  }
}