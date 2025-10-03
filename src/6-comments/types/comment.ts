import { Types } from 'mongoose';

export type Comment = {
  content: string;

  commentatorInfo: {
    userId: Types.ObjectId;
    userLogin: string;
  };

  postId: Types.ObjectId;
  createdAt: Date;

  likeCount: number;
  dislikeCount: number;
};
