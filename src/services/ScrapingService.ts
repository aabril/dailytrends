import { IFeedRepository } from '../repositories/FeedRepository';
import { IFeed } from '../types/Feed';

export class ScrapingService {
  constructor(private feedRepository: IFeedRepository) {}

  getServiceName(): string {
    return 'ScrapingService';
  }

  hasRepository(): boolean {
    return this.feedRepository !== null && this.feedRepository !== undefined;
  }

  async getFeedCount(): Promise<number> {
    return await this.feedRepository.count();
  }

  async saveFeedItem(feedData: Omit<IFeed, '_id' | 'createdAt' | 'updatedAt'>): Promise<IFeed> {
    return await this.feedRepository.create(feedData);
  }

  async feedExists(url: string): Promise<boolean> {
    const existingFeed = await this.feedRepository.findByUrl(url);
    return existingFeed !== null;
  }

  async saveIfNotExists(feedData: Omit<IFeed, '_id' | 'createdAt' | 'updatedAt'>): Promise<IFeed | null> {
    const exists = await this.feedExists(feedData.url);
    if (exists) {
      return null;
    }
    return await this.saveFeedItem(feedData);
  }
}