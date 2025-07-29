import { BaseNewspaperExtractor } from './BaseNewspaperExtractor';
import { NewsSource } from '../types/Feed';
import { Logger } from '../utils/logger';

/**
 * Extractor específico para El País
 */
export class ElPaisExtractor extends BaseNewspaperExtractor {
  constructor() {
    super({
      name: 'El País',
      source: NewsSource.EL_PAIS,
      baseUrl: 'https://elpais.com',
      frontPageUrl: 'https://elpais.com',
      selectors: {
        articleLinks: 'article h2 a, .c_t a, .articulo-titulo a, h2.articulo-titulo a',
        titleSelector: 'h1, .articulo-titulo',
        descriptionSelector: '.articulo-entradilla, .entradilla, .subtitulo',
        dateSelector: '.articulo-fecha, time',
        imageSelector: '.articulo-foto img, .foto img'
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
      const linkRegex = /<a[^>]+href=["']([^"']*(?:elpais\.com)?[^"']*)["'][^>]*>.*?<\/a>/gi;
      const urls: string[] = [];
      let match;

      while ((match = linkRegex.exec(html)) !== null) {
        let url = match[1];
        
        // Filtrar solo URLs de artículos relevantes
        if (url.includes('/politica/') || 
            url.includes('/economia/') || 
            url.includes('/sociedad/') ||
            url.includes('/internacional/') ||
            url.includes('/espana/')) {
          
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
      Logger.error(`Error extracting El País URLs:`, error);
      return [];
    }
  }
}