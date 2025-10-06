import { inject, injectable } from 'inversify';
import { PostsService } from '../application/posts.service';
import { matchedData } from 'express-validator';
import { setDefaultSortAndPaginationIfNotExist } from '../../core/helpers/set-default-sort-and-pagination';
import { Request, Response } from 'express';
import { PostsRepository } from '../repository/posts.repository';
import { HttpStatus } from '../../core/types/HttpStatus';
import { createErrorMessages } from '../../core/utils/error.utils';
import { CommentsService } from '../../6-comments/application/comments.service';
import { mapToPostListPaginatedOutput } from '../mappers/map-to-postlist-paginated-output.util';
import { mapToPostViewModel } from '../mappers/map-to-post-view-model.util';
import { PostInputDto } from '../dto/post-input.dto';
import { blogsService } from '../../1-blogs/application/blogs.service';
import { RequestWithParamsAndBodyAndUserId } from '../../core/types/requests';
import { IdType } from '../../core/types/id';
import { CommentInputDto } from '../../6-comments/dto/comment-input.dto';
import { UsersQwRepository } from '../../4-users/qw-repository/users-qw-repository';
import { LikeStatus } from '../../8-likes/types/like';
import { LikesService } from '../../8-likes/application/likes.service';

@injectable()
export class PostsController {
  constructor(
    @inject(PostsService) private postsService: PostsService,
    @inject(PostsRepository) private postsRepository: PostsRepository,
    @inject(CommentsService) private commentsService: CommentsService,
    @inject(UsersQwRepository) private usersQwRepository: UsersQwRepository,
    @inject(LikesService) private likesService: LikesService,
  ) {}

  async getCommentListHandler(req: Request, res: Response) {
    try {
      const queryData = matchedData(req, { locations: ['query'] });
      const queryInput = setDefaultSortAndPaginationIfNotExist(queryData);

      const userId = req.user?.id;

      const postId = req.params.id;

      const post = await this.postsRepository.findById(postId);

      if (!post) {
        res.status(HttpStatus.NotFound).send(createErrorMessages([{ field: 'id', message: 'Post not found' }]));
        return;
      }

      const comments = await this.commentsService.findManyByPostId(postId, queryInput as any, userId);

      res.status(HttpStatus.Ok).send(comments);
    } catch (error: unknown) {
      res.sendStatus(HttpStatus.InternalServerError);
    }
  }

  async getPostListHandler(req: Request, res: Response) {
    try {
      const queryData = matchedData(req, { locations: ['query'] });
      const queryInput = setDefaultSortAndPaginationIfNotExist(queryData);

      const { items, totalCount } = await this.postsService.findMany(queryInput as any);

      let itemsWithMyStatus;

      if (req.user?.id) {
        const parentsIds = items.map((item) => item._id);
        const likesArray = await this.likesService.getLikesByParentsIds(parentsIds, req.user.id);

        itemsWithMyStatus = items.map((postItem) => ({
          ...postItem,
          myStatus:
            likesArray.find((likeItem) => likeItem.parentId.toString() === postItem._id.toString())?.status ||
            LikeStatus.None,
        }));
      } else {
        itemsWithMyStatus = items.map((postItem) => ({ ...postItem, myStatus: LikeStatus.None }));
      }

      const postsOutput = mapToPostListPaginatedOutput(itemsWithMyStatus, {
        pageNumber: queryInput.pageNumber,
        pageSize: queryInput.pageSize,
        totalCount,
      });

      res.status(HttpStatus.Ok).send(postsOutput);
    } catch (error: unknown) {
      res.sendStatus(HttpStatus.InternalServerError);
    }
  }

  async getPostHandler(req: Request, res: Response) {
    try {
      const post = await this.postsService.findById(req.params.id);

      if (!post) {
        res.status(HttpStatus.NotFound).send(createErrorMessages([{ field: 'id', message: 'Post not found' }]));
        return;
      }

      const userId = req.user?.id;
      let postWithMyStatus = { ...post, myStatus: LikeStatus.None };

      if (userId) {
        const userStatus = await this.likesService.getUserLikeStatus(post._id.toString(), userId);
        postWithMyStatus.myStatus = userStatus;
      }

      res.status(HttpStatus.Ok).send(mapToPostViewModel(postWithMyStatus));
    } catch (error: unknown) {
      res.sendStatus(HttpStatus.InternalServerError);
    }
  }

  async postPostHandler(req: Request<{}, {}, PostInputDto>, res: Response) {
    try {
      const blog = await blogsService.findById(req.body.blogId);

      if (!blog) {
        res.status(HttpStatus.NotFound).send(createErrorMessages([{ field: 'id', message: 'Blog not found' }]));
        return;
      }

      const createdPost = await this.postsService.create(req.body, req.body.blogId, blog.name);

      console.log(7777, createdPost);

      const createdPostWithMyStatus = { ...createdPost, myStatus: LikeStatus.None };

      const postViewModel = mapToPostViewModel(createdPostWithMyStatus);

      res.status(HttpStatus.Created).send(postViewModel);
    } catch (error: unknown) {
      res.sendStatus(HttpStatus.InternalServerError);
    }
  }

  async postCommentHandler(req: RequestWithParamsAndBodyAndUserId<IdType, CommentInputDto, IdType>, res: Response) {
    try {
      const post = await this.postsService.findById(req.params.id);

      if (!post) {
        res.status(HttpStatus.NotFound).send(createErrorMessages([{ field: 'id', message: 'Post not found' }]));
        return;
      }

      const user = await this.usersQwRepository.findById(req.user!.id);

      if (!user) {
        res.status(HttpStatus.NotFound).send(createErrorMessages([{ field: 'id', message: 'User not found' }]));
        return;
      }

      const createdComment = await this.commentsService.create(req.body, user.id, user.login, post._id);

      res.status(HttpStatus.Created).send(createdComment);
    } catch (error: unknown) {
      res.sendStatus(HttpStatus.InternalServerError);
    }
  }

  async putPostHandler(req: Request, res: Response) {
    try {
      const post = await this.postsRepository.find(req.params.id);

      if (!post) {
        res.status(HttpStatus.NotFound).send(createErrorMessages([{ field: 'id', message: 'Post not found' }]));
        return;
      }

      const blog = await blogsService.findById(req.body.blogId);

      if (!blog) {
        res.status(HttpStatus.NotFound).send(createErrorMessages([{ field: 'id', message: 'Blog not found' }]));
        return;
      }

      await this.postsService.update(post, req.body, blog.name);

      console.log(6666, '======');

      res.sendStatus(HttpStatus.NoContent);
    } catch (error: unknown) {
      res.sendStatus(HttpStatus.InternalServerError);
    }
  }

  async deletePostHandler(req: Request, res: Response) {
    try {
      const post = await this.postsService.findById(req.params.id);

      if (!post) {
        res.status(HttpStatus.NotFound).send(createErrorMessages([{ field: 'id', message: 'Post not found' }]));
        return;
      }

      await this.postsService.delete(req.params.id);

      res.sendStatus(HttpStatus.NoContent);
    } catch (error: unknown) {
      res.sendStatus(HttpStatus.InternalServerError);
    }
  }
}
