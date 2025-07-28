import mongoose from 'mongoose';
import { Feed, IFeedDocument } from '../models/Feed.js';
import { NewsSource } from '../types/Feed.js';

describe('Feed Model', () => {
  const mockFeedData = {
    title: 'Test News Title',
    description: 'Test news description',
    url: 'https://example.com/news/1',
    source: NewsSource.EL_PAIS,
    publishedAt: new Date('2024-01-15T10:00:00Z'),
    imageUrl: 'https://example.com/image.jpg',
    category: 'Politics',
    isManual: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Validation', () => {
    test('should create a valid feed document', () => {
      const feed = new Feed(mockFeedData);
      
      expect(feed.title).toBe(mockFeedData.title);
      expect(feed.description).toBe(mockFeedData.description);
      expect(feed.url).toBe(mockFeedData.url);
      expect(feed.source).toBe(mockFeedData.source);
      expect(feed.publishedAt).toEqual(mockFeedData.publishedAt);
      expect(feed.imageUrl).toBe(mockFeedData.imageUrl);
      expect(feed.category).toBe(mockFeedData.category);
      expect(feed.isManual).toBe(mockFeedData.isManual);
    });

    test('should set default values correctly', () => {
      const minimalData = {
        title: 'Test Title',
        description: 'Test description',
        url: 'https://example.com/test',
        source: NewsSource.EL_MUNDO,
        publishedAt: new Date()
      };
      
      const feed = new Feed(minimalData);
      
      expect(feed.isManual).toBe(false);
      expect(feed.createdAt).toBeDefined();
      expect(feed.updatedAt).toBeDefined();
    });

    test('should require mandatory fields', () => {
      const feed = new Feed({});
      const validationError = feed.validateSync();
      
      expect(validationError?.errors.title).toBeDefined();
      expect(validationError?.errors.url).toBeDefined();
      expect(validationError?.errors.source).toBeDefined();
      expect(validationError?.errors.publishedAt).toBeDefined();
    });

    test('should validate NewsSource enum', () => {
      const invalidData = {
        ...mockFeedData,
        source: 'Invalid Source' as any
      };
      
      const feed = new Feed(invalidData);
      const validationError = feed.validateSync();
      
      expect(validationError?.errors.source).toBeDefined();
    });
  });

  describe('Document Transformation', () => {
    test('should transform _id to id in JSON', () => {
      const feed = new Feed(mockFeedData);
      feed._id = '507f1f77bcf86cd799439011';
      
      const json = feed.toJSON();
      
      expect(json.id.toString()).toBe('507f1f77bcf86cd799439011');
      expect(json._id).toBeUndefined();
      expect(json.__v).toBeUndefined();
    });

    test('should transform _id to id in Object', () => {
      const feed = new Feed(mockFeedData);
      feed._id = '507f1f77bcf86cd799439011';
      
      const obj = feed.toObject();
      
      expect(obj.id.toString()).toBe('507f1f77bcf86cd799439011');
      expect(obj._id).toBeUndefined();
      expect(obj.__v).toBeUndefined();
    });
  });

  describe('Model Methods', () => {
    test('should create Feed model instance', () => {
      expect(Feed).toBeDefined();
      expect(Feed.modelName).toBe('Feed');
    });

    test('should have unique URL index', () => {
      const indexes = Feed.schema.indexes();
      const urlIndex = indexes.find(index => 
        index[0].url && index[1].unique
      );
      
      expect(urlIndex).toBeDefined();
      expect(urlIndex?.[1].unique).toBe(true);
    });
  });
});