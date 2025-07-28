import { Feed, IFeedDocument } from '../models/Feed.js';
import { IFeed, ICreateFeedDto, IUpdateFeedDto, IFeedQuery, IPaginatedResponse, NewsSource } from '../types/Feed.js';
import { FilterQuery, UpdateQuery } from 'mongoose';

export interface IFeedRepository {
  create(feedData: ICreateFeedDto): Promise<IFeed>;
  findById(id: string): Promise<IFeed | null>;
  findByUrl(url: string): Promise<IFeed | null>;
  findAll(query: IFeedQuery): Promise<IPaginatedResponse<IFeed>>;
  findBySource(source: NewsSource): Promise<IFeed[]>;
  findTodaysFrontPage(source: NewsSource): Promise<IFeed[]>;
  update(id: string, updateData: IUpdateFeedDto): Promise<IFeed | null>;
  delete(id: string): Promise<boolean>;
  deleteMany(filter: FilterQuery<IFeedDocument>): Promise<number>;
  count(filter?: FilterQuery<IFeedDocument>): Promise<number>;
  exists(url: string): Promise<boolean>;
}

export class FeedRepository implements IFeedRepository {
  async create(feedData: ICreateFeedDto): Promise<IFeed> {
    const feed = new Feed({
      ...feedData,
      publishedAt: feedData.publishedAt || new Date(),
      isManual: feedData.isManual ?? false
    });
    
    const savedFeed = await feed.save();
    return savedFeed.toObject();
  }

  async findById(id: string): Promise<IFeed | null> {
    const feed = await Feed.findById(id).lean();
    return feed ? this.transformDocument(feed) : null;
  }

  async findByUrl(url: string): Promise<IFeed | null> {
    const feed = await Feed.findOne({ url }).lean();
    return feed ? this.transformDocument(feed) : null;
  }

  async findAll(query: IFeedQuery): Promise<IPaginatedResponse<IFeed>> {
    const {
      source,
      page = 1,
      limit = 20
    } = query;

    const filter: FilterQuery<IFeedDocument> = {};
    
    if (source) filter.source = source;

    const skip = (page - 1) * limit;

    const [feeds, total] = await Promise.all([
      Feed.find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Feed.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: feeds.map(feed => this.transformDocument(feed)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  async findBySource(source: NewsSource): Promise<IFeed[]> {
    const feeds = await Feed.find({ source }).sort({ publishedAt: -1 }).lean();
    return feeds.map((feed: any) => this.transformDocument(feed));
  }

  async findTodaysFrontPage(source: NewsSource): Promise<IFeed[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const feeds = await Feed.find({
      source,
      isManual: false,
      publishedAt: {
        $gte: today,
        $lt: tomorrow
      }
    }).sort({ publishedAt: -1 }).limit(10).lean();
    
    return feeds.map((feed: any) => this.transformDocument(feed));
  }

  async update(id: string, updateData: IUpdateFeedDto): Promise<IFeed | null> {
    const updatedFeed = await Feed.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean();
    
    return updatedFeed ? this.transformDocument(updatedFeed) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await Feed.findByIdAndDelete(id);
    return !!result;
  }

  async deleteMany(filter: FilterQuery<IFeedDocument>): Promise<number> {
    const result = await Feed.deleteMany(filter);
    return result.deletedCount || 0;
  }

  async count(filter: FilterQuery<IFeedDocument> = {}): Promise<number> {
    return await Feed.countDocuments(filter);
  }

  async exists(url: string): Promise<boolean> {
    const feed = await Feed.findOne({ url }).select('_id').lean();
    return !!feed;
  }

  private transformDocument(doc: any): IFeed {
    return {
      _id: doc._id.toString(),
      title: doc.title,
      description: doc.description,
      url: doc.url,
      source: doc.source,
      publishedAt: doc.publishedAt,
      imageUrl: doc.imageUrl,
      category: doc.category,
      isManual: doc.isManual,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };
  }
}

export default FeedRepository;