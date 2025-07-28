import { FeedService } from '../services/FeedService.js';
import { IFeedRepository } from '../repositories/FeedRepository.js';
import { NewsSource, IFeed, ICreateFeedDto, IUpdateFeedDto, IFeedQuery, IPaginatedResponse } from '../types/Feed.js';

// Mock FeedRepository
const mockFeedRepository: jest.Mocked<IFeedRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findByUrl: jest.fn(),
  findAll: jest.fn(),
  findBySource: jest.fn(),
  findTodaysFrontPage: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  count: jest.fn(),
  exists: jest.fn()
};

describe('FeedService', () => {
  let feedService: FeedService;
  
  const mockFeed: IFeed = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Test News Title',
    description: 'Test news description',
    url: 'https://example.com/news/1',
    source: NewsSource.EL_PAIS,
    publishedAt: new Date('2024-01-15T10:00:00Z'),
    imageUrl: 'https://example.com/image.jpg',
    category: 'Politics',
    isManual: false,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z')
  };

  const mockCreateFeedDto: ICreateFeedDto = {
    title: 'New Test News',
    description: 'New test news description',
    url: 'https://example.com/news/new',
    source: NewsSource.EL_MUNDO,
    publishedAt: new Date('2024-01-15T12:00:00Z'),
    imageUrl: 'https://example.com/new-image.jpg',
    category: 'Sports'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    feedService = new FeedService(mockFeedRepository);
  });

  describe('createFeed', () => {
    test('should create a feed successfully', async () => {
      mockFeedRepository.findByUrl.mockResolvedValueOnce(null);
      mockFeedRepository.create.mockResolvedValueOnce(mockFeed);

      const result = await feedService.createFeed(mockCreateFeedDto);

      expect(mockFeedRepository.findByUrl).toHaveBeenCalledWith(mockCreateFeedDto.url);
      expect(mockFeedRepository.create).toHaveBeenCalledWith(mockCreateFeedDto);
      expect(result).toEqual(mockFeed);
    });

    test('should throw error if URL already exists', async () => {
      mockFeedRepository.findByUrl.mockResolvedValueOnce(mockFeed);

      await expect(feedService.createFeed(mockCreateFeedDto))
        .rejects.toThrow('A feed with this URL already exists');

      expect(mockFeedRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getFeedById', () => {
    test('should return feed by ID', async () => {
      mockFeedRepository.findById.mockResolvedValueOnce(mockFeed);

      const result = await feedService.getFeedById('507f1f77bcf86cd799439011');

      expect(mockFeedRepository.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockFeed);
    });

    test('should return null for non-existent feed', async () => {
      mockFeedRepository.findById.mockResolvedValueOnce(null);

      const result = await feedService.getFeedById('507f1f77bcf86cd799439011');

      expect(result).toBeNull();
    });
  });

  describe('getAllFeeds', () => {
    test('should return paginated feeds with default values', async () => {
      const mockResponse: IPaginatedResponse<IFeed> = {
        data: [mockFeed],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };
      
      mockFeedRepository.findAll.mockResolvedValueOnce(mockResponse);

      const result = await feedService.getAllFeeds();

      expect(mockFeedRepository.findAll).toHaveBeenCalledWith({
        limit: 20,
        page: 1
      });
      expect(result).toEqual(mockResponse);
    });

    test('should pass custom query parameters', async () => {
      const query: IFeedQuery = {
        source: NewsSource.EL_PAIS,
        limit: 10,
        page: 2
      };
      
      const mockResponse: IPaginatedResponse<IFeed> = {
        data: [mockFeed],
        pagination: {
          page: 2,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: true
        }
      };
      
      mockFeedRepository.findAll.mockResolvedValueOnce(mockResponse);

      const result = await feedService.getAllFeeds(query);

      expect(mockFeedRepository.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateFeed', () => {
    const updateData: IUpdateFeedDto = {
      title: 'Updated Title',
      description: 'Updated description'
    };

    test('should update feed successfully', async () => {
      const updatedFeed = { ...mockFeed, ...updateData };
      mockFeedRepository.update.mockResolvedValueOnce(updatedFeed);

      const result = await feedService.updateFeed('507f1f77bcf86cd799439011', updateData);

      expect(mockFeedRepository.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', updateData);
      expect(result).toEqual(updatedFeed);
    });

    test('should check URL conflicts when updating URL', async () => {
      const updateWithUrl: IUpdateFeedDto = {
        ...updateData,
        url: 'https://example.com/new-url'
      };
      
      const existingFeed = { ...mockFeed, _id: 'different-id' };
      mockFeedRepository.findByUrl.mockResolvedValueOnce(existingFeed);

      await expect(feedService.updateFeed('507f1f77bcf86cd799439011', updateWithUrl))
        .rejects.toThrow('A feed with this URL already exists');

      expect(mockFeedRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteFeed', () => {
    test('should delete feed successfully', async () => {
      mockFeedRepository.delete.mockResolvedValueOnce(true);

      const result = await feedService.deleteFeed('507f1f77bcf86cd799439011');

      expect(mockFeedRepository.delete).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toBe(true);
    });
  });

  describe('getTodaysFrontPageNews', () => {
    test('should return combined feeds from all sources', async () => {
      const elPaisFeeds = [{ ...mockFeed, source: NewsSource.EL_PAIS }];
      const elMundoFeeds = [{ ...mockFeed, source: NewsSource.EL_MUNDO }];
      
      mockFeedRepository.findTodaysFrontPage
        .mockResolvedValueOnce(elPaisFeeds)
        .mockResolvedValueOnce(elMundoFeeds);

      const result = await feedService.getTodaysFrontPageNews();

      expect(mockFeedRepository.findTodaysFrontPage).toHaveBeenCalledWith(NewsSource.EL_PAIS);
      expect(mockFeedRepository.findTodaysFrontPage).toHaveBeenCalledWith(NewsSource.EL_MUNDO);
      expect(result).toEqual([...elPaisFeeds, ...elMundoFeeds]);
    });

    test('should return empty array if no feeds found', async () => {
      mockFeedRepository.findTodaysFrontPage
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await feedService.getTodaysFrontPageNews();

      expect(result).toEqual([]);
    });
  });

  describe('getFeedsBySource', () => {
    test('should return feeds by source', async () => {
      const sourceFeeds = [mockFeed];
      mockFeedRepository.findBySource.mockResolvedValueOnce(sourceFeeds);

      const result = await feedService.getFeedsBySource(NewsSource.EL_PAIS);

      expect(mockFeedRepository.findBySource).toHaveBeenCalledWith(NewsSource.EL_PAIS);
      expect(result).toEqual(sourceFeeds);
    });

    test('should use default limit', async () => {
      const sourceFeeds = [mockFeed];
      mockFeedRepository.findBySource.mockResolvedValueOnce(sourceFeeds);

      const result = await feedService.getFeedsBySource(NewsSource.EL_PAIS, 5);

      expect(mockFeedRepository.findBySource).toHaveBeenCalledWith(NewsSource.EL_PAIS);
      expect(result).toEqual(sourceFeeds);
    });
  });
});