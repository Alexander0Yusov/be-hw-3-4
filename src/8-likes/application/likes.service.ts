import { inject, injectable } from 'inversify';
import { LikesRepository } from '../repository/likes.repository';
import { UsersQwRepository } from '../../4-users/qw-repository/users-qw-repository';
import { CommentsRepository } from '../../6-comments/repository/comments.repository';
import { LikeStatus } from '../types/like';
import { Result } from '../../core/result/result.type';
import { ResultStatus } from '../../core/result/resultCode';

@injectable()
export class LikesService {
  constructor(
    @inject(LikesRepository) private likesRepository: LikesRepository,
    @inject(UsersQwRepository) private usersQwRepository: UsersQwRepository,
    @inject(CommentsRepository) private commentsRepository: CommentsRepository,
  ) {}

  async createOrUpdate(
    parentId: string,
    status: LikeStatus,
    userId: string,
  ): Promise<Result<{ commentId: string } | null>> {
    // проверить существование юзера и коммента

    const user = await this.usersQwRepository.findById(userId);
    if (!user) {
      return {
        status: ResultStatus.Unauthorized,
        errorMessage: 'Unauthorized',
        extensions: [{ field: 'loginOrEmail', message: 'Wrong credentials' }],
        data: null,
      };
    }

    const comment = await this.commentsRepository.findById(parentId);
    if (!comment) {
      return {
        status: ResultStatus.NotFound,
        errorMessage: 'NotFound',
        extensions: [{ field: 'commentId', message: 'Wrong comment id' }],
        data: null,
      };
    }

    const currentStatus = await this.likesRepository.getUserLikeStatus(parentId, userId);

    if (status === currentStatus) {
      return {
        status: ResultStatus.NoContent,
        data: { commentId: comment.id },
        extensions: [],
      };
    }

    await this.likesRepository.createOrUpdate(parentId, userId, status);

    const { likes, dislikes } = await this.likesRepository.countReactions(parentId);

    await this.commentsRepository.updateCommentLikesCounts(parentId, likes, dislikes);

    return {
      status: ResultStatus.NoContent,
      data: { commentId: comment.id },
      extensions: [],
    };
  }
}
