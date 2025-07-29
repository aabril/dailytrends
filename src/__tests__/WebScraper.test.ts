import { WebScraper } from '../utils/WebScraper';
import { NewsSource } from '../types/Feed';
import { Logger } from '../utils/logger';

// Mock the Logger
jest.mock('../utils/logger', () => ({
  Logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock fetch
global.fetch = jest.fn();

describe('WebScraper', () => {
  let webScraper: WebScraper;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    webScraper = new WebScraper();
    jest.clearAllMocks();
  });

  describe('scrapeUrl', () => {
    test('should successfully scrape a URL with complete metadata', async () => {
      const mockHtml = `
        <html>
          <head>
            <title>Test News Article</title>
            <meta property="og:title" content="Test News Article">
            <meta property="og:description" content="This is a test news article description">
            <meta property="article:published_time" content="2024-01-15T10:30:00Z">
          </head>
          <body>
            <h1>Test News Article</h1>
            <p>Article content here...</p>
          </body>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml)
      } as Response);

      const result = await webScraper.scrapeUrl('https://example.com/news');

      expect(result).toEqual({
        title: 'Test News Article',
        description: 'This is a test news article description',
        url: 'https://example.com/news',
        publishedAt: new Date('2024-01-15T10:30:00Z')
      });

      expect(mockFetch).toHaveBeenCalledWith('https://example.com/news', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; DailyTrends/1.0)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
    });

    test('should handle HTTP errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response);

      const result = await webScraper.scrapeUrl('https://example.com/not-found');

      expect(result).toBeNull();
      expect(Logger.error).toHaveBeenCalledWith(
        'Failed to fetch https://example.com/not-found: 404 Not Found'
      );
    });

    test('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await webScraper.scrapeUrl('https://example.com/error');

      expect(result).toBeNull();
      expect(Logger.error).toHaveBeenCalledWith(
        'Error scraping https://example.com/error:',
        expect.any(Error)
      );
    });

    test('should return null when no title is found', async () => {
      const mockHtml = `
        <html>
          <head>
            <meta property="og:description" content="Description without title">
          </head>
          <body>
            <p>Content without title</p>
          </body>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml)
      } as Response);

      const result = await webScraper.scrapeUrl('https://example.com/no-title');

      expect(result).toBeNull();
      expect(Logger.warn).toHaveBeenCalledWith('No title found for https://example.com/no-title');
    });

    test('should return null when no description is found', async () => {
      const mockHtml = `
        <html>
          <head>
            <title>Title Only</title>
          </head>
          <body>
            <p>Content without description meta</p>
          </body>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml)
      } as Response);

      const result = await webScraper.scrapeUrl('https://example.com/no-description');

      expect(result).toBeNull();
      expect(Logger.warn).toHaveBeenCalledWith('No description found for https://example.com/no-description');
    });

    test('should use current date when no published date is found', async () => {
      const mockHtml = `
        <html>
          <head>
            <title>Test Article</title>
            <meta property="og:description" content="Test description">
          </head>
        </html>
      `;

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockHtml)
      } as Response);

      const beforeScrape = new Date();
      const result = await webScraper.scrapeUrl('https://example.com/no-date');
      const afterScrape = new Date();

      expect(result).not.toBeNull();
      expect(result!.publishedAt.getTime()).toBeGreaterThanOrEqual(beforeScrape.getTime());
      expect(result!.publishedAt.getTime()).toBeLessThanOrEqual(afterScrape.getTime());
    });
  });

  describe('convertToFeedData', () => {
    test('should convert scraped data to feed format', () => {
    const scrapedData = {
      title: 'Test News',
      description: 'Test description',
      url: 'https://example.com/news',
      publishedAt: new Date('2024-01-15T10:00:00Z')
    };
    
    const feedData = webScraper.convertToFeedData(scrapedData, NewsSource.EL_PAIS);
    
    expect(feedData).toEqual({
      title: 'Test News',
      description: 'Test description',
      url: 'https://example.com/news',
      source: NewsSource.EL_PAIS,
      publishedAt: new Date('2024-01-15T10:00:00Z'),
      isManual: false
    });
  });

  test('should handle HTML with special characters and entities', async () => {
    const htmlWithEntities = `
      <html>
        <head>
          <title>News &amp; Updates - El Pa&iacute;s</title>
          <meta name="description" content="Breaking news &quot;today&quot; &amp; analysis">
        </head>
      </html>
    `;
    
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(htmlWithEntities)
    });
    
    const result = await webScraper.scrapeUrl('https://example.com/news');
    
    expect(result).toEqual({
      title: 'News &amp; Updates - El Pa&iacute;s',
      description: 'Breaking news &quot;today&quot; &amp; analysis',
      url: 'https://example.com/news',
      publishedAt: expect.any(Date)
    });
  });
});
});