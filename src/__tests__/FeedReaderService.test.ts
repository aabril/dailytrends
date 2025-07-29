import { FeedReaderService } from '../services/FeedReaderService';
import { IFeedRepository } from '../repositories/FeedRepository';
import { NewsSource } from '../types/Feed';

// Mock dependencies
jest.mock('../utils/logger');
jest.mock('../services/ScrapingService');
jest.mock('../utils/WebScraper');
jest.mock('../extractors/ElPaisExtractor');
jest.mock('../extractors/ElMundoExtractor');

// Mock fetch globally
global.fetch = jest.fn();

const mockFeedRepository: jest.Mocked<IFeedRepository> = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByUrl: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findBySource: jest.fn(),
  findTodaysFrontPage: jest.fn(),
  deleteMany: jest.fn(),
  count: jest.fn(),
  exists: jest.fn()
};

// Mock ScrapingService
const mockScrapingService = {
  processFeedBatch: jest.fn()
};

jest.mock('../services/ScrapingService', () => {
  return {
    ScrapingService: jest.fn().mockImplementation(() => mockScrapingService)
  };
});

// Mock WebScraper
const mockWebScraper = {
  scrapeUrl: jest.fn(),
  convertToFeedData: jest.fn()
};

jest.mock('../utils/WebScraper', () => {
  return {
    WebScraper: jest.fn().mockImplementation(() => mockWebScraper)
  };
});

// Mock extractors
const mockExtractor = {
  extractNews: jest.fn(),
  isEnabled: jest.fn().mockReturnValue(true),
  getName: jest.fn(),
  getSource: jest.fn()
};

const mockElPaisExtractor = {
  ...mockExtractor,
  getName: jest.fn().mockReturnValue('El País'),
  getSource: jest.fn().mockReturnValue(NewsSource.EL_PAIS)
};

const mockElMundoExtractor = {
  ...mockExtractor,
  getName: jest.fn().mockReturnValue('El Mundo'),
  getSource: jest.fn().mockReturnValue(NewsSource.EL_MUNDO)
};

jest.mock('../extractors/NewspaperExtractorFactory', () => ({
  NewspaperExtractorFactory: {
    getAllAvailableExtractors: jest.fn(() => [mockElPaisExtractor, mockElMundoExtractor]),
    createExtractor: jest.fn((source) => {
      if (source === NewsSource.EL_PAIS) return mockElPaisExtractor;
      if (source === NewsSource.EL_MUNDO) return mockElMundoExtractor;
      return null;
    })
  }
}));

describe('FeedReaderService', () => {
  let feedReaderService: FeedReaderService;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    feedReaderService = new FeedReaderService(mockFeedRepository);
  });

  describe('Constructor and Initialization', () => {
    it('should initialize with available extractors', () => {
      const newspapers = feedReaderService.getAvailableNewspapers();
      expect(newspapers).toHaveLength(2);
      expect(newspapers.map(n => n.source)).toContain(NewsSource.EL_PAIS);
      expect(newspapers.map(n => n.source)).toContain(NewsSource.EL_MUNDO);
    });

    it('should have all extractors enabled by default', () => {
      const newspapers = feedReaderService.getAvailableNewspapers();
      newspapers.forEach(newspaper => {
        expect(newspaper.enabled).toBe(true);
      });
    });
  });

});