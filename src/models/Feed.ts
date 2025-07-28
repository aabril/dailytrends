import mongoose, { Schema, Document } from 'mongoose';
import { IFeed, NewsSource } from '../types/Feed.js';

export interface IFeedDocument extends IFeed, Document {
  _id: string;
}

const feedSchemaObject = {
  title: {
    type: String,
    required: true
  },
  
  description: {
    type: String
  },
  
  url: {
    type: String,
    required: true
  },
  
  imageUrl: {
    type: String
  },
  
  source: {
    type: String,
    required: true,
    enum: Object.values(NewsSource)
  },
  
  category: {
    type: String
  },
  
  publishedAt: {
    type: Date,
    required: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  isManual: {
    type: Boolean,
    default: false
  }
} as const;

const feedSchemaSettings = {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  
  toJSON: {
    transform: (doc: any, ret: any) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  
  toObject: {
    transform: (doc: any, ret: any) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
} as const;

const feedSchema = new Schema<IFeedDocument>(feedSchemaObject as any, feedSchemaSettings);

feedSchema.index({ url: 1 }, { unique: true });

export const Feed = mongoose.model<IFeedDocument>('Feed', feedSchema);
export default Feed;