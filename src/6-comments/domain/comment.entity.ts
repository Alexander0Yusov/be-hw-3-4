import { model, Schema } from 'mongoose';
import { Comment } from '../types/comment';

export const commentSchema = new Schema<Comment>({
  content: { type: String, required: true },

  commentatorInfo: {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    userLogin: { type: String, required: true },
  },

  postId: { type: Schema.Types.ObjectId, required: true, ref: 'Post' },
  createdAt: { type: Date, required: true },

  likeCount: { type: Number, required: true, default: 0 },
  dislikeCount: { type: Number, required: true, default: 0 },
});

export const CommentModel = model<Comment>('Comments', commentSchema);
