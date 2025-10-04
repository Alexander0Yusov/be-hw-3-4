import { model, Schema } from 'mongoose';
import { Like, LikeStatus } from '../types/like';

export const likesSchema = new Schema<Like>(
  {
    status: {
      type: String,
      enum: Object.values(LikeStatus),
      required: true,
    },

    authorId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    parentId: { type: Schema.Types.ObjectId, required: true, ref: 'Comment' }, // commentId, postId и т.д.

    login: { type: String, required: false },
  },
  {
    timestamps: true, // ← добавит createdAt и updatedAt автоматически
  },
);

export const LikeModel = model<Like>('Likes', likesSchema);
