import { inject, injectable } from 'inversify';
import { LikesRepository } from '../repository/likes.repository';
import { UsersQwRepository } from '../../4-users/qw-repository/users-qw-repository';
import { CommentsRepository } from '../../6-comments/repository/comments.repository';
import { Like, LikeStatus } from '../types/like';
import { Result } from '../../core/result/result.type';
import { ResultStatus } from '../../core/result/resultCode';
import { PostsRepository } from '../../2-posts/repository/posts.repository';
import { Types } from 'mongoose';
import { WithId } from 'mongodb';

@injectable()
export class LikesService {
  constructor(
    @inject(LikesRepository) private likesRepository: LikesRepository,
    @inject(UsersQwRepository) private usersQwRepository: UsersQwRepository,
    @inject(CommentsRepository) private commentsRepository: CommentsRepository,
    @inject(PostsRepository) private postsRepository: PostsRepository,
  ) {}

  async getUserLikeStatus(parentId: string, userId: string): Promise<LikeStatus> {
    return await this.likesRepository.getUserLikeStatus(parentId, userId);
  }

  async getLikesByParentsIds(parentsIds: Types.ObjectId[], userId: string): Promise<WithId<Like>[]> {
    return await this.likesRepository.getLikesByParentsIds(parentsIds, userId);
  }

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

  async createOrUpdateLikeForPost(
    parentId: string,
    status: LikeStatus,
    userId: string,
  ): Promise<Result<{ postId: string } | null>> {
    // проверить существование юзера и поста

    const user = await this.usersQwRepository.findById(userId);

    if (!user) {
      return {
        status: ResultStatus.Unauthorized,
        errorMessage: 'Unauthorized',
        extensions: [{ field: 'loginOrEmail', message: 'Wrong credentials' }],
        data: null,
      };
    }

    const post = await this.postsRepository.find(parentId);

    console.log(555, post);

    if (!post) {
      return {
        status: ResultStatus.NotFound,
        errorMessage: 'NotFound',
        extensions: [{ field: 'postId', message: 'Wrong post id' }],
        data: null,
      };
    }

    const currentStatus = await this.likesRepository.getUserLikeStatus(parentId, userId);

    if (status === currentStatus) {
      return {
        status: ResultStatus.NoContent,
        data: { postId: post._id.toString() },
        extensions: [],
      };
    }

    await this.likesRepository.createOrUpdate(parentId, userId, status, user.login);

    const { likes, dislikes } = await this.likesRepository.countReactions(parentId);
    const latestLikes = await this.likesRepository.getLatestLikes(parentId);
    await this.postsRepository.updateLikesData(parentId, likes, dislikes, latestLikes);

    // DDD - conception
    // post.updateLike(latestLikes, likes, dislikes);
    // await this.postsRepository.save(post);

    return {
      status: ResultStatus.NoContent,
      data: { postId: post._id.toString() },
      extensions: [],
    };
  }
}
