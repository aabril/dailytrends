import mongoose, { Schema, Document } from 'mongoose';
import { IFeed } from '../types/Feed.js';

export interface IFeedDocument extends IFeed, Document {
    _id: string;
}

const feedSchema = new Schema<IFeedDocument>({
  }, {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      }
    },
    toObject: {
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      }
    }
  });


export const Feed = mongoose.model<IFeedDocument>('Feed', feedSchema);
export default Feed;