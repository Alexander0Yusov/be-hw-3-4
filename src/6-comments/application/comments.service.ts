import { ObjectId } from 'mongodb';
import { Comment } from '../types/comment';
import { CommentInputDto } from '../dto/comment-input.dto';
import { CommentViewModel } from '../types/comment-view-model';
import { CommentQueryInput } from '../router/input/blog-query.input';
import { CommentListPaginatedOutput } from '../router/output/comment-list-paginated.output';
import { CommentsRepository } from '../repository/comments.repository';
import { inject, injectable } from 'inversify';
import { LikesRepository } from '../../8-likes/repository/likes.repository';
import { LikeStatus } from '../../8-likes/types/like';

@injectable()
export class CommentsService {
  constructor(
    @inject(CommentsRepository) private commentsRepository: CommentsRepository,
    @inject(LikesRepository) private likesRepository: LikesRepository,
  ) {}

  async findManyByPostId(
    id: string,
    queryDto: CommentQueryInput,
    userId?: string,
  ): Promise<CommentListPaginatedOutput> {
    const { pageNumber, pageSize } = queryDto;

    const { totalCount, items } = await this.commentsRepository.findManyByPostId(id, queryDto);

    let itemsWithLikesStatus;

    if (userId) {
      // находим все айдишки комментариев
      const commentsIds = items.map((item) => item._id);

      // находим все лайки всех юзеров ко всем комментариям
      const likes = await this.likesRepository.getLikesByParentsIds(commentsIds, userId);

      itemsWithLikesStatus = items.map((item) => {
        const itemWithCurrentUserStatus = likes.find(
          ({ parentId, authorId }) => parentId.toString() === item._id.toString() && authorId.toString() === userId,
        );

        if (itemWithCurrentUserStatus) {
          return { ...item, myStatus: itemWithCurrentUserStatus.status };
        } else {
          return { ...item, myStatus: LikeStatus.None };
        }
      });
    } else {
      itemsWithLikesStatus = items.map((item) => ({ ...item, myStatus: LikeStatus.None }));
    }

    return {
      pagesCount: Math.ceil(totalCount / pageSize),
      page: pageNumber,
      pageSize,
      totalCount,
      items: itemsWithLikesStatus.map(
        ({ _id, content, commentatorInfo, createdAt, likeCount, dislikeCount, myStatus }) => ({
          id: _id.toString(),
          content,
          commentatorInfo: {
            userId: commentatorInfo.userId.toString(),
            userLogin: commentatorInfo.userLogin,
          },
          createdAt,
          likesInfo: {
            likesCount: likeCount,
            dislikesCount: dislikeCount,
            myStatus,
          },
        }),
      ),
    };
  }

  async create(dto: CommentInputDto, userId: string, userLogin: string, postId: ObjectId): Promise<CommentViewModel> {
    const newComment: Comment = {
      content: dto.content,

      commentatorInfo: {
        userId: new ObjectId(userId),
        userLogin,
      },

      postId: postId,
      createdAt: new Date(),

      likeCount: 0,
      dislikeCount: 0,
    };

    return this.commentsRepository.create(newComment);
  }

  async findById(id: string): Promise<CommentViewModel | null> {
    return await this.commentsRepository.findById(id);
  }

  async findByIdAndUserId(id: string, userId: string): Promise<CommentViewModel | null> {
    let comment = await this.commentsRepository.findById(id);

    if (comment) {
      const likeStatus = await this.likesRepository.getUserLikeStatus(id, userId);

      comment.likesInfo.myStatus = likeStatus;

      return comment;
    }

    return null;
  }

  async update(id: string, dto: CommentInputDto): Promise<void> {
    await this.commentsRepository.update(id, dto);
    return;
  }

  async delete(id: string): Promise<void> {
    await this.commentsRepository.delete(id);
    return;
  }
}
