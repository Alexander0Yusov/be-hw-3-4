import { injectable } from 'inversify';
import { Like, LikeStatus } from '../types/like';
import { LikeModel } from '../domain/like.entity';
import { Types } from 'mongoose';
import { WithId } from 'mongodb';

@injectable()
export class LikesRepository {
  async createOrUpdate(parentId: string, authorId: string, newStatus: LikeStatus): Promise<string> {
    const result = await LikeModel.findOneAndUpdate(
      {
        parentId: new Types.ObjectId(parentId),
        authorId: new Types.ObjectId(authorId),
      },
      {
        $set: { status: newStatus },
      },
      {
        new: true, // вернуть обновлённый документ
        upsert: true, // создать, если не найден
      },
    ).lean();

    return result.status;
  }

  async countReactions(parentId: string): Promise<{ likes: number; dislikes: number }> {
    const result = await LikeModel.aggregate([
      {
        $match: {
          parentId: new Types.ObjectId(parentId),
          status: { $in: [LikeStatus.Like, LikeStatus.Dislike] },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    let likes = 0;
    let dislikes = 0;

    for (const item of result) {
      if (item._id === LikeStatus.Like) likes = item.count;
      if (item._id === LikeStatus.Dislike) dislikes = item.count;
    }

    return { likes, dislikes };
  }

  async getUserLikeStatus(parentId: string, userId: string): Promise<LikeStatus> {
    const like = await LikeModel.findOne({
      parentId: new Types.ObjectId(parentId),
      authorId: new Types.ObjectId(userId),
    }).lean();

    return like?.status ?? LikeStatus.None;
  }

  async getLikesByCommentsIds(commentsIds: Types.ObjectId[]): Promise<WithId<Like>[]> {
    return await LikeModel.find({
      parentId: { $in: commentsIds },
    }).lean();
  }
}
