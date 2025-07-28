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
  });
});