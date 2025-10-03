import { Request, Response } from 'express';
import { HttpStatus } from '../../../core/types/HttpStatus';
import { matchedData } from 'express-validator';
import { setDefaultSortAndPaginationIfNotExist } from '../../../core/helpers/set-default-sort-and-pagination';

import { CommentsService } from '../../../6-comments/application/comments.service';
import { postsRepository } from '../../repository/posts.repository';
import { createErrorMessages } from '../../../core/utils/error.utils';
import { container } from '../../../composition-root';

const commentsService = container.get<CommentsService>(CommentsService);

export async function getCommentListHandler(req: Request, res: Response) {
  try {
    const queryData = matchedData(req, { locations: ['query'] });
    const queryInput = setDefaultSortAndPaginationIfNotExist(queryData);

    const userId = req.user?.id;

    const postId = req.params.id;

    const post = await postsRepository.findById(postId);

    if (!post) {
      res.status(HttpStatus.NotFound).send(createErrorMessages([{ field: 'id', message: 'Post not found' }]));
      return;
    }

    const comments = await commentsService.findManyByPostId(postId, queryInput as any, userId);

    res.status(HttpStatus.Ok).send(comments);
  } catch (error: unknown) {
    res.sendStatus(HttpStatus.InternalServerError);
  }
}
