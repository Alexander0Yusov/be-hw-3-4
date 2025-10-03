import { Router } from 'express';
import { idValidationMiddleware } from '../../core/middlewares/validation/id-validation.middleware';
import { errorsCatchMiddleware } from '../../core/middlewares/validation/errors-catch.middleware';
import { accessTokenGuard } from '../../5-auth/router/guards/access.token.guard';
import { commentDtoValidationMiddleware } from '../validation/comment-dto-validation.middleware';
import { CommentsController } from './controller/comments-controller';
import { container } from '../../composition-root';
import { LikesController } from '../../8-likes/controller/likes-controller';
import { likeDtoValidationMiddleware } from '../../8-likes/validation/like-dto-validation.middleware';
import { accessTokenNoStrict } from '../../5-auth/router/guards/access.token.nostrict';

export const commentsRouter = Router({});

const commentsController = container.get<CommentsController>(CommentsController);
const likesController = container.get<LikesController>(LikesController);

commentsRouter
  .get(
    '/:id',
    accessTokenNoStrict,
    idValidationMiddleware,
    errorsCatchMiddleware,
    commentsController.getCommentHandler.bind(commentsController),
  )

  .put(
    '/:id',
    accessTokenGuard,
    idValidationMiddleware,
    commentDtoValidationMiddleware,
    errorsCatchMiddleware,
    commentsController.putCommentHandler.bind(commentsController),
  )

  .delete(
    '/:id',
    accessTokenGuard,
    idValidationMiddleware,
    errorsCatchMiddleware,
    commentsController.deleteCommentHandler.bind(commentsController),
  )

  //
  .put(
    '/:id/like-status',
    accessTokenGuard,
    idValidationMiddleware,
    likeDtoValidationMiddleware,
    errorsCatchMiddleware,
    likesController.createOrUpdateLikeStatus.bind(likesController),
  );
