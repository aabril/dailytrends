import { IFeed, NewsSource } from '../types/Feed.js';
import { Logger } from './logger.js';

interface ScrapedData {
  title: string;
  description: string;
  url: string;
  publishedAt: Date;
}

export class WebScraper {
  private userAgent = 'Mozilla/5.0 (compatible; DailyTrends/1.0)';

  async scrapeUrl(url: string): Promise<ScrapedData | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      if (!response.ok) {
        Logger.error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
        return null;
      }

      const html = await response.text();
      return this.parseHtml(html, url);
    } catch (error) {
      Logger.error(`Error scraping ${url}:`, error);
      return null;
    }
  }

  private parseHtml(html: string, url: string): ScrapedData | null {
    try {
      // Extract title from <title> tag or Open Graph
      const title = this.extractTitle(html);
      if (!title) {
        Logger.warn(`No title found for ${url}`);
        return null;
      }

      // Extract description from meta tags
      const description = this.extractDescription(html);
      if (!description) {
        Logger.warn(`No description found for ${url}`);
        return null;
      }

      // Extract published date
      const publishedAt = this.extractPublishedDate(html);

      return {
        title: title.trim(),
        description: description.trim(),
        url,
        publishedAt
      };
    } catch (error) {
      Logger.error(`Error parsing HTML for ${url}:`, error);
      return null;
    }
  }

  private extractTitle(html: string): string | null {
    // Try Open Graph title first
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    if (ogTitleMatch) {
      return ogTitleMatch[1];
    }

    // Try Twitter title
    const twitterTitleMatch = html.match(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']+)["']/i);
    if (twitterTitleMatch) {
      return twitterTitleMatch[1];
    }

    // Fall back to <title> tag
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      return titleMatch[1];
    }

    return null;
  }

  private extractDescription(html: string): string | null {
    // Try Open Graph description first
    const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
    if (ogDescMatch) {
      return ogDescMatch[1];
    }

    // Try Twitter description
    const twitterDescMatch = html.match(/<meta\s+name=["']twitter:description["']\s+content=["']([^"']+)["']/i);
    if (twitterDescMatch) {
      return twitterDescMatch[1];
    }

    // Try meta description
    const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    if (metaDescMatch) {
      return metaDescMatch[1];
    }

    return null;
  }

  private extractPublishedDate(html: string): Date {
    // Try various date formats
    const datePatterns = [
      /<meta\s+property=["']article:published_time["']\s+content=["']([^"']+)["']/i,
      /<meta\s+name=["']pubdate["']\s+content=["']([^"']+)["']/i,
      /<time[^>]+datetime=["']([^"']+)["']/i
    ];

    for (const pattern of datePatterns) {
      const match = html.match(pattern);
      if (match) {
        const date = new Date(match[1]);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    // Default to current date if no published date found
    return new Date();
  }

  convertToFeedData(scrapedData: ScrapedData, source: NewsSource): Omit<IFeed, '_id' | 'createdAt' | 'updatedAt'> {
    return {
      title: scrapedData.title,
      description: scrapedData.description,
      url: scrapedData.url,
      source,
      publishedAt: scrapedData.publishedAt,
      isManual: false
    };
  }
}