import { Types } from 'mongoose';

export enum LikeStatus {
  Like = 'Like',
  Dislike = 'Dislike',
  None = 'None',
}

export type Like = {
  status: LikeStatus;
  authorId: Types.ObjectId;
  parentId: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
};
