import { ScrapingScheduler } from '../services/ScrapingScheduler';
import { ContentScrapingService } from '../services/ContentScrapingService';
import { IFeedRepository } from '../repositories/FeedRepository';
import { NewsSource } from '../types/Feed';

// Mock dependencies
jest.mock('../services/ContentScrapingService');
jest.useFakeTimers();

describe('ScrapingScheduler', () => {
  let scrapingScheduler: ScrapingScheduler;
  let mockFeedRepository: jest.Mocked<IFeedRepository>;
  let mockContentScrapingService: jest.Mocked<ContentScrapingService>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    
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

    mockContentScrapingService = {
      scrapeFromMultipleSources: jest.fn(),
  
      scrapeFromWebUrls: jest.fn(),
      scrapeFromSource: jest.fn()
    } as unknown as jest.Mocked<ContentScrapingService>;
    
    // Mock ContentScrapingService constructor
    (ContentScrapingService as jest.MockedClass<typeof ContentScrapingService>)
      .mockImplementation(() => mockContentScrapingService);

    // Mock static method
    (ContentScrapingService.createNewsSourceConfigs as jest.Mock) = jest.fn().mockReturnValue([
      {
        name: 'El País',
        source: NewsSource.EL_PAIS,
        webUrls: ['https://elpais.com'],
        enabled: true
      },
      {
        name: 'El Mundo',
        source: NewsSource.EL_MUNDO,
        webUrls: ['https://elmundo.es'],
        enabled: true
      }
    ]);

    scrapingScheduler = new ScrapingScheduler(mockFeedRepository, {
      intervalMinutes: 1, // 1 minute for testing
      maxRetries: 2,
      retryDelayMinutes: 1,
      enabled: true
    });
  });

  afterEach(() => {
    scrapingScheduler.stop();
  });

  describe('Basic Functionality', () => {
    test('should create ScrapingScheduler instance with default config', () => {
      const defaultScheduler = new ScrapingScheduler(mockFeedRepository);
      const config = defaultScheduler.getConfig();
      
      expect(config).toEqual({
        intervalMinutes: 30,
        maxRetries: 3,
        retryDelayMinutes: 5,
        enabled: true
      });
    });

    test('should create ScrapingScheduler instance with custom config', () => {
      const customConfig = {
        intervalMinutes: 15,
        maxRetries: 5,
        retryDelayMinutes: 2,
        enabled: false
      };
      
      const customScheduler = new ScrapingScheduler(mockFeedRepository, customConfig);
      const config = customScheduler.getConfig();
      
      expect(config).toEqual(customConfig);
    });

    test('should initialize with empty stats', () => {
      const stats = scrapingScheduler.getStats();
      
      expect(stats).toEqual({
        lastRun: null,
        nextRun: null,
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        totalItemsScraped: 0,
        totalDuplicates: 0
      });
    });
  });

  describe('Scheduler Control', () => {
    test('should start and stop scheduler', () => {
      expect(scrapingScheduler.isSchedulerRunning()).toBe(false);
      
      scrapingScheduler.start();
      expect(scrapingScheduler.isSchedulerRunning()).toBe(true);
      
      scrapingScheduler.stop();
      expect(scrapingScheduler.isSchedulerRunning()).toBe(false);
    });

    test('should not start if already running', () => {
      scrapingScheduler.start();
      const firstStart = scrapingScheduler.isSchedulerRunning();
      
      scrapingScheduler.start(); // Try to start again
      const secondStart = scrapingScheduler.isSchedulerRunning();
      
      expect(firstStart).toBe(true);
      expect(secondStart).toBe(true);
      expect(jest.getTimerCount()).toBe(1); // Only one timer should be active
    });

    test('should not start if disabled', () => {
      const disabledScheduler = new ScrapingScheduler(mockFeedRepository, { enabled: false });
      
      disabledScheduler.start();
      expect(disabledScheduler.isSchedulerRunning()).toBe(false);
    });
  });

  describe('Scraping Cycle', () => {
    test('should run successful scraping cycle', async () => {
      const mockResults = new Map([
        ['El País', { success: 5, failed: 0, duplicates: 2, items: [] }],
        ['El Mundo', { success: 3, failed: 0, duplicates: 1, items: [] }]
      ]);
      
      mockContentScrapingService.scrapeFromMultipleSources.mockResolvedValue(mockResults);
      
      await scrapingScheduler.runScrapingCycle();
      
      const stats = scrapingScheduler.getStats();
      expect(stats.totalRuns).toBe(1);
      expect(stats.successfulRuns).toBe(1);
      expect(stats.failedRuns).toBe(0);
      expect(stats.totalItemsScraped).toBe(8); // 5 + 3
      expect(stats.totalDuplicates).toBe(3); // 2 + 1
      expect(stats.lastRun).toBeInstanceOf(Date);
    });

    test.skip('should handle scraping cycle errors with retries', async () => {
      mockContentScrapingService.scrapeFromMultipleSources
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockRejectedValueOnce(new Error('Second attempt failed'))
        .mockResolvedValueOnce(new Map([
          ['El País', { success: 2, failed: 0, duplicates: 1, items: [] }]
        ]));
      
      await scrapingScheduler.runScrapingCycle();
      
      const stats = scrapingScheduler.getStats();
      expect(stats.totalRuns).toBe(1);
      expect(stats.successfulRuns).toBe(1);
      expect(stats.failedRuns).toBe(0);
      expect(mockContentScrapingService.scrapeFromMultipleSources).toHaveBeenCalledTimes(3);
    });

    test.skip('should fail after max retries', async () => {
      mockContentScrapingService.scrapeFromMultipleSources
        .mockRejectedValue(new Error('Persistent failure'));
      
      await scrapingScheduler.runScrapingCycle();
      
      const stats = scrapingScheduler.getStats();
      expect(stats.totalRuns).toBe(1);
      expect(stats.successfulRuns).toBe(0);
      expect(stats.failedRuns).toBe(1);
      expect(mockContentScrapingService.scrapeFromMultipleSources).toHaveBeenCalledTimes(3); // 1 + 2 retries
    }, 10000);

    test.skip('should not run concurrent cycles', async () => {
      let resolveFirst: () => void;
      const firstPromise = new Promise<void>(resolve => {
        resolveFirst = resolve;
      });
      
      mockContentScrapingService.scrapeFromMultipleSources.mockImplementation(() => firstPromise.then(() => new Map()));
      
      // Start first cycle
      const firstCycle = scrapingScheduler.runScrapingCycle();
      expect(scrapingScheduler.isCycleRunning()).toBe(true);
      
      // Try to start second cycle while first is running
      const secondCycle = scrapingScheduler.runScrapingCycle();
      
      // Resolve first cycle
      resolveFirst!();
      await firstCycle;
      await secondCycle;
      
      const stats = scrapingScheduler.getStats();
      expect(stats.totalRuns).toBe(1); // Only one cycle should have run
      expect(mockContentScrapingService.scrapeFromMultipleSources).toHaveBeenCalledTimes(1);
    }, 10000);
  });

  describe('Single Source Scraping', () => {
    test('should run single source scraping successfully', async () => {
      const mockResult = { success: 3, failed: 0, duplicates: 1, items: [] };
      mockContentScrapingService.scrapeFromSource.mockResolvedValue(mockResult);
      
      await scrapingScheduler.runSingleSource('El País');
      
      expect(mockContentScrapingService.scrapeFromSource).toHaveBeenCalledWith({
        name: 'El País',
        source: NewsSource.EL_PAIS,
        webUrls: ['https://elpais.com'],
        enabled: true
      });
    });

    test('should handle unknown source name', async () => {
      await expect(scrapingScheduler.runSingleSource('Unknown Source'))
        .rejects.toThrow('Source configuration not found: Unknown Source');
    });

    test('should handle single source scraping errors', async () => {
      mockContentScrapingService.scrapeFromSource.mockRejectedValue(new Error('Scraping failed'));
      
      await expect(scrapingScheduler.runSingleSource('El País'))
        .rejects.toThrow('Scraping failed');
    });
  });

  describe('Configuration Management', () => {
    test('should update configuration', () => {
      const newConfig = {
        intervalMinutes: 60,
        maxRetries: 5
      };
      
      scrapingScheduler.updateConfig(newConfig);
      const config = scrapingScheduler.getConfig();
      
      expect(config.intervalMinutes).toBe(60);
      expect(config.maxRetries).toBe(5);
      expect(config.retryDelayMinutes).toBe(1); // Should keep existing value
      expect(config.enabled).toBe(true); // Should keep existing value
    });

    test('should restart scheduler when updating config while running', () => {
      scrapingScheduler.start();
      expect(scrapingScheduler.isSchedulerRunning()).toBe(true);
      
      scrapingScheduler.updateConfig({ intervalMinutes: 60 });
      expect(scrapingScheduler.isSchedulerRunning()).toBe(true);
      expect(scrapingScheduler.getConfig().intervalMinutes).toBe(60);
    });

    test('should not restart scheduler when updating config while stopped', () => {
      expect(scrapingScheduler.isSchedulerRunning()).toBe(false);
      
      scrapingScheduler.updateConfig({ intervalMinutes: 60 });
      expect(scrapingScheduler.isSchedulerRunning()).toBe(false);
    });
  });

  describe('Statistics Management', () => {
    test('should reset statistics', () => {
      // Simulate some activity
      scrapingScheduler.start();
      const statsBeforeReset = scrapingScheduler.getStats();
      statsBeforeReset.totalRuns = 5;
      statsBeforeReset.successfulRuns = 3;
      statsBeforeReset.totalItemsScraped = 100;
      
      scrapingScheduler.resetStats();
      const statsAfterReset = scrapingScheduler.getStats();
      
      expect(statsAfterReset.totalRuns).toBe(0);
      expect(statsAfterReset.successfulRuns).toBe(0);
      expect(statsAfterReset.failedRuns).toBe(0);
      expect(statsAfterReset.totalItemsScraped).toBe(0);
      expect(statsAfterReset.totalDuplicates).toBe(0);
      expect(statsAfterReset.lastRun).toBeNull();
    });
  });

  describe('Graceful Shutdown', () => {
    test('should shutdown gracefully when not running', async () => {
      await expect(scrapingScheduler.shutdown()).resolves.not.toThrow();
      expect(scrapingScheduler.isSchedulerRunning()).toBe(false);
    });

    test.skip('should shutdown gracefully when running', async () => {
      scrapingScheduler.start();
      expect(scrapingScheduler.isSchedulerRunning()).toBe(true);
      
      await scrapingScheduler.shutdown();
      expect(scrapingScheduler.isSchedulerRunning()).toBe(false);
    }, 10000);
  });
});