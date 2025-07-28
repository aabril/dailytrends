import { Context } from 'hono';
import { IFeedService } from '../services/FeedService.js';
import { NewsSource } from '../types/Feed.js';

export class FeedController {
  private feedService: IFeedService;

  constructor(feedService: IFeedService) {
    this.feedService = feedService;
  }

  public getAllFeeds = async (c: Context) => {
    const query = c.req.query();
    
    const feedQuery = {
      source: query.source as NewsSource,
      category: query.category,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      limit: query.limit ? parseInt(query.limit) : 20,
      offset: query.offset ? parseInt(query.offset) : 0
    };

    const result = await this.feedService.getAllFeeds(feedQuery);
    
    return c.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  };

  public getTodaysNews = async (c: Context) => {
    const feeds = await this.feedService.getTodaysFrontPageNews();
    
    return c.json({
      success: true,
      data: feeds,
      count: feeds.length
    });
  };

  public getFeedById = async (c: Context) => {
    const id = c.req.param('id');
    const feed = await this.feedService.getFeedById(id);
    
    return c.json({
      success: true,
      data: feed
    });
  };

  public createFeed = async (c: Context) => {
    const body = await c.req.json();
    
    const feedData = {
      ...body,
      source: NewsSource.MANUAL,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date()
    };
    
    const feed = await this.feedService.createFeed(feedData);
    
    return c.json({
      success: true,
      data: feed,
      message: 'Feed creado exitosamente'
    }, 201);
  };

  public updateFeed = async (c: Context) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const updateData = {
      ...body,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : undefined
    };
    
    const feed = await this.feedService.updateFeed(id, updateData);
    
    return c.json({
      success: true,
      data: feed,
      message: 'Feed actualizado exitosamente'
    });
  };

  public deleteFeed = async (c: Context) => {
    const id = c.req.param('id');
    const deleted = await this.feedService.deleteFeed(id);
    
    return c.json({
      success: true,
      message: 'Feed eliminado exitosamente'
    });
  };

  public getFeedsBySource = async (c: Context) => {
    const source = c.req.param('source') as NewsSource;
    const limit = parseInt(c.req.query('limit') || '10');
    
    const feeds = await this.feedService.getFeedsBySource(source, limit);
    
    return c.json({
      success: true,
      data: feeds,
      count: feeds.length
    });
  };

}