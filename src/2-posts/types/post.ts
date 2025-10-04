import { ObjectId } from 'mongodb';
import { Like } from '../../8-likes/types/like';
import mongoose from 'mongoose';

export type Post = {
  title: string;
  shortDescription: string;
  content: string;
  blogId: mongoose.mongo.BSON.ObjectId;
  blogName: string;
  createdAt: Date;
  //
  likesCount: number;
  dislikesCount: number;
  newestLikes: Like[];
};
