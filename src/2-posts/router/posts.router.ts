import { Router } from 'express';
import { idValidationMiddleware } from '../../core/middlewares/validation/id-validation.middleware';
import { errorsCatchMiddleware } from '../../core/middlewares/validation/errors-catch.middleware';
import { superAdminGuardMiddleware } from '../../core/middlewares/validation/super-admin-guard.middleware';
import { postDtoValidationMiddleware } from '../validation/post-dto-validation.middleware';
import { paginationAndSortingValidation } from '../../core/middlewares/validation/query-pagination-sorting.validation-middleware';
import { PostSortField } from './input/post-sort-field';
import { commentDtoValidationMiddleware } from '../../6-comments/validation/comment-dto-validation.middleware';
import { accessTokenGuard } from '../../5-auth/router/guards/access.token.guard';
import { CommentSortField } from './input/comment-sort-field';
import { accessTokenNoStrict } from '../../5-auth/router/guards/access.token.nostrict';
import { container } from '../../composition-root';
import { PostsController } from '../controller/posts-controller';

export const postsRouter = Router({});
const postsController = container.get<PostsController>(PostsController);

postsRouter
  .get('', paginationAndSortingValidation(PostSortField), postsController.getPostListHandler.bind(postsController))

  .get(
    '/:id/comments',
    accessTokenNoStrict,
    paginationAndSortingValidation(CommentSortField),
    postsController.getCommentListHandler.bind(postsController),
  )

  .post(
    '',
    superAdminGuardMiddleware,
    postDtoValidationMiddleware,
    errorsCatchMiddleware,
    postsController.postPostHandler.bind(postsController),
  )

  .post(
    '/:id/comments',
    accessTokenGuard,
    idValidationMiddleware,
    commentDtoValidationMiddleware,
    errorsCatchMiddleware,
    postsController.postCommentHandler.bind(postsController),
  )

  .get('/:id', idValidationMiddleware, errorsCatchMiddleware, postsController.getPostHandler.bind(postsController))

  .put(
    '/:id',
    superAdminGuardMiddleware,
    idValidationMiddleware,
    postDtoValidationMiddleware,
    errorsCatchMiddleware,
    postsController.putPostHandler.bind(postsController),
  )

  .delete(
    '/:id',
    superAdminGuardMiddleware,
    idValidationMiddleware,
    errorsCatchMiddleware,
    postsController.deletePostHandler.bind(postsController),
  );
