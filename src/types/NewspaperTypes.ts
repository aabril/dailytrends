import { NewsSource } from './Feed.js';
import { IFeed } from './Feed.js';

/**
 * Interfaz para definir la configuración de extracción de un periódico
 */
export interface NewspaperConfig {
  name: string;
  source: NewsSource;
  baseUrl: string;
  frontPageUrl: string;
  selectors: NewsSelectors;
  enabled: boolean;
}

/**
 * Selectores CSS para extraer elementos específicos de cada periódico
 */
export interface NewsSelectors {
  articleLinks: string;
  titleSelector?: string;
  descriptionSelector?: string;
  dateSelector?: string;
  imageSelector?: string;
}

/**
 * Resultado del proceso de scraping
 */
export interface ScrapingResult {
  success: number;
  failed: number;
  duplicates: number;
  items: (IFeed | null)[];
  errors: string[];
}