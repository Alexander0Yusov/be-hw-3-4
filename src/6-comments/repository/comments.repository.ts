import { Comment } from '../types/comment';
import { CommentViewModel } from '../types/comment-view-model';
import { CommentQueryInput } from '../router/input/blog-query.input';
import { CommentInputDto } from '../dto/comment-input.dto';
import { CommentListPaginatedOutput } from '../router/output/comment-list-paginated.output';
import { Types } from 'mongoose';
import { CommentModel } from '../domain/comment.entity';
import { injectable } from 'inversify';
import { LikeStatus } from '../../8-likes/types/like';
import { WithId } from 'mongodb';

// export const commentsRepository = {
//   async findManyByPostId(id: string, queryDto: CommentQueryInput): Promise<CommentListPaginatedOutput> {
//     const { pageNumber, pageSize, sortBy, sortDirection } = queryDto;

//     const skip = (pageNumber - 1) * pageSize;
//     const filter: any = {};

//     filter.postId = new ObjectId(id);

//     const items = await db
//       .getCollections()
//       .commentCollection.find(filter)
//       .sort({ [sortBy]: sortDirection })
//       .skip(skip)
//       .limit(pageSize)
//       .toArray();

//     const totalCount = await db.getCollections().commentCollection.countDocuments(filter);

//     const res = {
//       pagesCount: Math.ceil(totalCount / pageSize),
//       page: pageNumber,
//       pageSize,
//       totalCount,
//       items: items.map(({ _id, content, commentatorInfo, createdAt }) => ({
//         id: _id.toString(),
//         content,
//         commentatorInfo: {
//           userId: commentatorInfo.userId.toString(),
//           userLogin: commentatorInfo.userLogin,
//         },
//         createdAt,
//       })),
//     };

//     return res;
//   },

//   async findById(id: string): Promise<CommentViewModel | null> {
//     const foundComment = await db.getCollections().commentCollection.findOne({ _id: new ObjectId(id) });

//     if (!foundComment) {
//       return null;
//     }

//     return {
//       id: foundComment._id.toString(),
//       content: foundComment.content,
//       commentatorInfo: {
//         userId: foundComment.commentatorInfo.userId.toString(),
//         userLogin: foundComment.commentatorInfo.userLogin,
//       },
//       createdAt: foundComment.createdAt,
//     };
//   },

//   async create(comment: Comment): Promise<CommentViewModel> {
//     const insertedResult = await db.getCollections().commentCollection.insertOne(comment);

//     return {
//       id: insertedResult.insertedId.toString(),
//       content: comment.content,
//       commentatorInfo: {
//         userId: comment.commentatorInfo.userId.toString(),
//         userLogin: comment.commentatorInfo.userLogin,
//       },
//       createdAt: comment.createdAt,
//     };
//   },

//   async update(id: string, dto: CommentInputDto): Promise<void> {
//     const updateResult = await db.getCollections().commentCollection.updateOne(
//       { _id: new ObjectId(id) },
//       {
//         $set: {
//           content: dto.content,
//         },
//       },
//     );

//     if (updateResult.matchedCount < 1) {
//       throw new Error('Comment not exist');
//     }

//     return;
//   },

//   async delete(id: string): Promise<void> {
//     const deleteResult = await db.getCollections().commentCollection.deleteOne({
//       _id: new ObjectId(id),
//     });

//     if (deleteResult.deletedCount < 1) {
//       throw new Error('Comment not exist');
//     }
//   },
// };

@injectable()
export class CommentsRepository {
  async findManyByPostId(
    id: string,
    queryDto: CommentQueryInput,
  ): Promise<{ totalCount: number; items: WithId<Comment>[] }> {
    if (!Types.ObjectId.isValid(id)) {
      return {
        totalCount: 0,
        items: [],
      };
    }

    const { pageNumber, pageSize, sortBy, sortDirection } = queryDto;
    const skip = (pageNumber - 1) * pageSize;
    const filter = { postId: new Types.ObjectId(id) };

    const totalCount = await CommentModel.countDocuments(filter);

    const items = await CommentModel.find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(pageSize)
      .lean();

    return { totalCount, items };
  }

  async findById(id: string): Promise<CommentViewModel | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const foundComment = await CommentModel.findById(id).lean();

    if (!foundComment) return null;

    return {
      id: foundComment._id.toString(),
      content: foundComment.content,
      commentatorInfo: {
        userId: foundComment.commentatorInfo.userId.toString(),
        userLogin: foundComment.commentatorInfo.userLogin,
      },
      createdAt: foundComment.createdAt,
      likesInfo: {
        likesCount: foundComment.likeCount,
        dislikesCount: foundComment.dislikeCount,
        myStatus: LikeStatus.None,
      },
    };
  }

  async create(comment: Comment): Promise<CommentViewModel> {
    const created = await CommentModel.create(comment);

    return {
      id: created._id.toString(),
      content: created.content,
      commentatorInfo: {
        userId: created.commentatorInfo.userId.toString(),
        userLogin: created.commentatorInfo.userLogin,
      },
      createdAt: created.createdAt,
      likesInfo: {
        likesCount: created.likeCount,
        dislikesCount: created.dislikeCount,
        myStatus: LikeStatus.None,
      },
    };
  }

  async update(id: string, dto: CommentInputDto): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid ID');

    const result = await CommentModel.updateOne({ _id: id }, { $set: { content: dto.content } });

    if (result.matchedCount < 1) {
      throw new Error('Comment not exist');
    }
  }

  async delete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid ID');

    const result = await CommentModel.deleteOne({ _id: id });

    if (result.deletedCount < 1) {
      throw new Error('Comment not exist');
    }
  }

  async updateCommentLikesCounts(commentId: string, likeCount: number, dislikeCount: number) {
    const updatedComment = await CommentModel.findByIdAndUpdate(
      new Types.ObjectId(commentId),
      {
        $set: {
          likeCount,
          dislikeCount,
        },
      },
      {
        new: true, // вернуть обновлённый документ, если нужно
      },
    ).lean();

    return updatedComment;
  }
}
