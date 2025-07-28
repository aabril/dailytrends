import { ScrapingService } from '../services/ScrapingService';
import { IFeedRepository } from '../repositories/FeedRepository';

// Mock FeedRepository
const mockFeedRepository: jest.Mocked<IFeedRepository> = {
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

describe('ScrapingService', () => {
  let scrapingService: ScrapingService;

  beforeEach(() => {
    jest.clearAllMocks();
    scrapingService = new ScrapingService(mockFeedRepository);
  });

  describe('Basic Functionality', () => {
    test('should create ScrapingService instance', () => {
      expect(scrapingService).toBeInstanceOf(ScrapingService);
    });

    test('should return service name', () => {
      const serviceName = scrapingService.getServiceName();
      expect(serviceName).toBe('ScrapingService');
    });

    test('should have access to repository', () => {
      const hasRepository = scrapingService.hasRepository();
      expect(hasRepository).toBe(true);
    });

    test('should get feed count from repository', async () => {
      mockFeedRepository.count.mockResolvedValue(5);
      
      const count = await scrapingService.getFeedCount();
      
      expect(mockFeedRepository.count).toHaveBeenCalled();
      expect(count).toBe(5);
    });

    test('should handle repository errors when getting feed count', async () => {
      const errorMessage = 'Database connection failed';
      mockFeedRepository.count.mockRejectedValue(new Error(errorMessage));
      
      await expect(scrapingService.getFeedCount()).rejects.toThrow(errorMessage);
      expect(mockFeedRepository.count).toHaveBeenCalled();
    });

    test('should save feed item to repository', async () => {
      const feedData = {
        title: 'Test News',
        description: 'Test description',
        url: 'https://example.com/news',
        source: 'El País' as any,
        publishedAt: new Date(),
        isManual: false
      };
      
      const savedFeed = { _id: '1', ...feedData };
      mockFeedRepository.create.mockResolvedValue(savedFeed);
      
      const result = await scrapingService.saveFeedItem(feedData);
      
      expect(mockFeedRepository.create).toHaveBeenCalledWith(feedData);
      expect(result).toEqual(savedFeed);
    });

    test('should check if feed exists by URL', async () => {
      const testUrl = 'https://example.com/news';
      const existingFeed = {
        _id: '1',
        title: 'Existing News',
        description: 'Existing description',
        url: testUrl,
        source: 'El País' as any,
        publishedAt: new Date(),
        isManual: false
      };
      
      mockFeedRepository.findByUrl.mockResolvedValue(existingFeed);
      
      const exists = await scrapingService.feedExists(testUrl);
      
      expect(mockFeedRepository.findByUrl).toHaveBeenCalledWith(testUrl);
      expect(exists).toBe(true);
    });

    test('should save feed item only if it does not exist', async () => {
      const feedData = {
        title: 'New News',
        description: 'New description',
        url: 'https://example.com/new-news',
        source: 'El País' as any,
        publishedAt: new Date(),
        isManual: false
      };
      
      const savedFeed = { _id: '2', ...feedData };
      mockFeedRepository.findByUrl.mockResolvedValue(null);
      mockFeedRepository.create.mockResolvedValue(savedFeed);
      
      const result = await scrapingService.saveIfNotExists(feedData);
      
      expect(mockFeedRepository.findByUrl).toHaveBeenCalledWith(feedData.url);
      expect(mockFeedRepository.create).toHaveBeenCalledWith(feedData);
      expect(result).toEqual(savedFeed);
    });

    test('should return null when trying to save existing feed', async () => {
      const feedData = {
        title: 'Existing News',
        description: 'Existing description',
        url: 'https://example.com/existing-news',
        source: 'El País' as any,
        publishedAt: new Date(),
        isManual: false
      };
      
      const existingFeed = { _id: '1', ...feedData };
      mockFeedRepository.findByUrl.mockResolvedValue(existingFeed);
      
      const result = await scrapingService.saveIfNotExists(feedData);
      
      expect(mockFeedRepository.findByUrl).toHaveBeenCalledWith(feedData.url);
      expect(mockFeedRepository.create).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    test('should process multiple feed items and return results', async () => {
      const feedItems = [
        {
          title: 'News 1',
          description: 'Description 1',
          url: 'https://example.com/news1',
          source: 'El País' as any,
          publishedAt: new Date(),
          isManual: false
        },
        {
          title: 'News 2',
          description: 'Description 2',
          url: 'https://example.com/news2',
          source: 'El País' as any,
          publishedAt: new Date(),
          isManual: false
        }
      ];
      
      const savedFeeds = [
        { _id: '1', ...feedItems[0] },
        { _id: '2', ...feedItems[1] }
      ];
      
      mockFeedRepository.findByUrl.mockResolvedValue(null);
      mockFeedRepository.create.mockResolvedValueOnce(savedFeeds[0]).mockResolvedValueOnce(savedFeeds[1]);
      
      const results = await scrapingService.processFeedBatch(feedItems);
      
      expect(mockFeedRepository.findByUrl).toHaveBeenCalledTimes(2);
      expect(mockFeedRepository.create).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(savedFeeds[0]);
      expect(results[1]).toEqual(savedFeeds[1]);
    });
  });
});