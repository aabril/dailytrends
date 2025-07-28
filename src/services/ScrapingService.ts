import { IFeedRepository } from '../repositories/FeedRepository';

export class ScrapingService {
  constructor(private feedRepository: IFeedRepository) {}
}