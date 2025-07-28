import { IFeedRepository } from '../repositories/FeedRepository.js';
import { IFeed, ICreateFeedDto, IUpdateFeedDto, IFeedQuery, IPaginatedResponse, NewsSource } from '../types/Feed.js';

export interface IFeedService {
  createFeed(feedData: ICreateFeedDto): Promise<IFeed>;
  getFeedById(id: string): Promise<IFeed | null>;
  getAllFeeds(query?: IFeedQuery): Promise<IPaginatedResponse<IFeed>>;
  updateFeed(id: string, updateData: IUpdateFeedDto): Promise<IFeed | null>;
  deleteFeed(id: string): Promise<boolean>;
  getTodaysFrontPageNews(): Promise<IFeed[]>;
  getFeedsBySource(source: NewsSource, limit?: number): Promise<IFeed[]>;
}

export class FeedService implements IFeedService {
  constructor(private feedRepository: IFeedRepository) {}

  async createFeed(feedData: ICreateFeedDto): Promise<IFeed> {
    const existingFeed = await this.feedRepository.findByUrl(feedData.url);
    if (existingFeed) {
      throw new Error('A feed with this URL already exists');
    }
    return await this.feedRepository.create(feedData);
  }

  async getFeedById(id: string): Promise<IFeed | null> {
    return await this.feedRepository.findById(id);
  }

  async getAllFeeds(query: IFeedQuery = {}): Promise<IPaginatedResponse<IFeed>> {
    const sanitizedQuery = {
      ...query,
      limit: query.limit || 20,
      page: query.page || 1
    };
    return await this.feedRepository.findAll(sanitizedQuery);
  }

  async updateFeed(id: string, updateData: IUpdateFeedDto): Promise<IFeed | null> {
    if (updateData.url) {
      const existingFeed = await this.feedRepository.findByUrl(updateData.url);
      if (existingFeed && existingFeed._id !== id) {
        throw new Error('A feed with this URL already exists');
      }
    }
    return await this.feedRepository.update(id, updateData);
  }

  async deleteFeed(id: string): Promise<boolean> {
    return await this.feedRepository.delete(id);
  }

  async getTodaysFrontPageNews(): Promise<IFeed[]> {
    const [elPaisFeeds, elMundoFeeds] = await Promise.all([
      this.feedRepository.findTodaysFrontPage(NewsSource.EL_PAIS),
      this.feedRepository.findTodaysFrontPage(NewsSource.EL_MUNDO)
    ]);
    return [...elPaisFeeds, ...elMundoFeeds];
  }

  async getFeedsBySource(source: NewsSource, limit: number = 10): Promise<IFeed[]> {
    return await this.feedRepository.findBySource(source);
  }
}