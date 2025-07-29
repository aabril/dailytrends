import { ContentScrapingService } from '../services/ContentScrapingService';
import { WebScraper } from '../utils/WebScraper';
import { ScrapingService } from '../services/ScrapingService';
import { IFeedRepository } from '../repositories/FeedRepository';
import { NewsSource } from '../types/Feed';
import { Logger } from '../utils/logger';

// Mock dependencies
jest.mock('../utils/WebScraper');
jest.mock('../services/ScrapingService');
jest.mock('../utils/logger');

describe('ContentScrapingService', () => {
  let contentScrapingService: ContentScrapingService;
  let mockFeedRepository: jest.Mocked<IFeedRepository>;
  let mockWebScraper: jest.Mocked<WebScraper>;

  let mockScrapingService: jest.Mocked<ScrapingService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockFeedRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByUrl: jest.fn(),
      findBySource: jest.fn(),
      findTodaysFrontPage: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
      exists: jest.fn()
    };

    mockWebScraper = new WebScraper() as jest.Mocked<WebScraper>;

    mockScrapingService = new ScrapingService(mockFeedRepository) as jest.Mocked<ScrapingService>;

    // Mock constructor calls
    (WebScraper as jest.MockedClass<typeof WebScraper>).mockImplementation(() => mockWebScraper);

    (ScrapingService as jest.MockedClass<typeof ScrapingService>).mockImplementation(() => mockScrapingService);

    contentScrapingService = new ContentScrapingService(mockFeedRepository);
  });



  describe('scrapeFromWebUrls', () => {
    test('should successfully scrape from web URLs', async () => {
      const mockScrapedData = [
        {
          title: 'Web Article 1',
          description: 'Web Description 1',
          url: 'https://example.com/web1',
          publishedAt: new Date()
        },
        {
          title: 'Web Article 2',
          description: 'Web Description 2',
          url: 'https://example.com/web2',
          publishedAt: new Date()
        }
      ];

      const mockFeedData = mockScrapedData.map(data => ({
        ...data,
        source: NewsSource.EL_MUNDO,
        isManual: false
      }));

      const mockResults = [
        { _id: '1', ...mockFeedData[0] },
        { _id: '2', ...mockFeedData[1] }
      ];

      mockWebScraper.scrapeUrl
        .mockResolvedValueOnce(mockScrapedData[0])
        .mockResolvedValueOnce(mockScrapedData[1]);
      
      mockWebScraper.convertToFeedData
        .mockReturnValueOnce(mockFeedData[0])
        .mockReturnValueOnce(mockFeedData[1]);

      mockScrapingService.processFeedBatch.mockResolvedValue(mockResults);

      const urls = ['https://example.com/web1', 'https://example.com/web2'];
      const result = await contentScrapingService.scrapeFromWebUrls(urls, NewsSource.EL_MUNDO);

      expect(mockWebScraper.scrapeUrl).toHaveBeenCalledTimes(2);
      expect(mockWebScraper.convertToFeedData).toHaveBeenCalledTimes(2);
      expect(mockScrapingService.processFeedBatch).toHaveBeenCalledWith(mockFeedData);
      expect(result).toEqual({
        success: 2,
        failed: 0,
        duplicates: 0,
        items: mockResults
      });
    });

    test('should handle failed web scraping', async () => {
      mockWebScraper.scrapeUrl
        .mockResolvedValueOnce(null)
        .mockRejectedValueOnce(new Error('Scraping failed'));

      const urls = ['https://example.com/fail1', 'https://example.com/fail2'];
      const result = await contentScrapingService.scrapeFromWebUrls(urls, NewsSource.EL_MUNDO);

      expect(result).toEqual({
        success: 0,
        failed: 2,
        duplicates: 0,
        items: []
      });
      expect(mockScrapingService.processFeedBatch).not.toHaveBeenCalled();
    });
  });

  describe('scrapeFromSource', () => {
    test('should scrape from web URLs', async () => {
      const config = {
        name: 'Test Source',
        source: NewsSource.EL_PAIS,
        webUrls: ['https://example.com/web1'],
        enabled: true
      };

      const mockScrapedData = {
        title: 'Web Article',
        description: 'Web Description',
        url: 'https://example.com/web1',
        publishedAt: new Date()
      };

      const mockWebFeedData = {
        ...mockScrapedData,
        source: NewsSource.EL_PAIS,
        isManual: false
      };

      // Mock web scraping
      mockWebScraper.scrapeUrl.mockResolvedValue(mockScrapedData);
      mockWebScraper.convertToFeedData.mockReturnValue(mockWebFeedData);
      mockScrapingService.processFeedBatch.mockResolvedValue([{ _id: '1', ...mockWebFeedData }]);

      const result = await contentScrapingService.scrapeFromSource(config);

      expect(result).toEqual({
        success: 1,
        failed: 0,
        duplicates: 0,
        items: [{ _id: '1', ...mockWebFeedData }]
      });
    });

    test('should skip disabled sources', async () => {
      const config = {
        name: 'Disabled Source',
        source: NewsSource.EL_PAIS,
        webUrls: ['https://example.com/web1'],
        enabled: false
      };

      const result = await contentScrapingService.scrapeFromSource(config);

      expect(result).toEqual({
        success: 0,
        failed: 0,
        duplicates: 0,
        items: []
      });
      expect(mockWebScraper.scrapeUrl).not.toHaveBeenCalled();
    });
  });

  describe('scrapeFromMultipleSources', () => {
    test('should scrape from multiple sources', async () => {
      const configs = [
        {
          name: 'Source 1',
          source: NewsSource.EL_PAIS,
          webUrls: ['https://example.com/web1'],
          enabled: true
        },
        {
          name: 'Source 2',
          source: NewsSource.EL_MUNDO,
          webUrls: ['https://example.com/web2'],
          enabled: true
        }
      ];

      const mockScrapedData1 = {
        title: 'Article 1',
        description: 'Description 1',
        url: 'https://example.com/web1',
        publishedAt: new Date()
      };

      const mockScrapedData2 = {
        title: 'Article 2',
        description: 'Description 2',
        url: 'https://example.com/web2',
        publishedAt: new Date()
      };

      const mockFeedData1 = { ...mockScrapedData1, source: NewsSource.EL_PAIS, isManual: false };
      const mockFeedData2 = { ...mockScrapedData2, source: NewsSource.EL_MUNDO, isManual: false };

      mockWebScraper.scrapeUrl
        .mockResolvedValueOnce(mockScrapedData1)
        .mockResolvedValueOnce(mockScrapedData2);
      
      mockWebScraper.convertToFeedData
        .mockReturnValueOnce(mockFeedData1)
        .mockReturnValueOnce(mockFeedData2);

      mockScrapingService.processFeedBatch
        .mockResolvedValueOnce([{ _id: '1', ...mockFeedData1 }])
        .mockResolvedValueOnce([{ _id: '2', ...mockFeedData2 }]);

      const results = await contentScrapingService.scrapeFromMultipleSources(configs);

      expect(results.size).toBe(2);
      expect(results.get('Source 1')).toEqual({
        success: 1,
        failed: 0,
        duplicates: 0,
        items: [{ _id: '1', ...mockFeedData1 }]
      });
      expect(results.get('Source 2')).toEqual({
        success: 1,
        failed: 0,
        duplicates: 0,
        items: [{ _id: '2', ...mockFeedData2 }]
      });
    });
  });

  describe('createNewsSourceConfigs', () => {
    test('should create default news source configurations', () => {
      const configs = ContentScrapingService.createNewsSourceConfigs();

      expect(configs).toHaveLength(2);
      expect(configs[0]).toEqual({
        name: 'El País',
        source: NewsSource.EL_PAIS,
        enabled: true
      });
      expect(configs[1]).toEqual({
        name: 'El Mundo',
        source: NewsSource.EL_MUNDO,
        enabled: true
      });
    });
  });
});