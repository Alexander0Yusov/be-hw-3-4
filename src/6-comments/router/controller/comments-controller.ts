import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { CommentsService } from '../../application/comments.service';
import { HttpStatus } from '../../../core/types/HttpStatus';
import { createErrorMessages } from '../../../core/utils/error.utils';

@injectable()
export class CommentsController {
  constructor(@inject(CommentsService) private commentsService: CommentsService) {}

  async getCommentHandler(req: Request, res: Response) {
    try {
      let comment;

      if (req.user?.id) {
        comment = await this.commentsService.findByIdAndUserId(req.params.id, req.user?.id);
      } else {
        comment = await this.commentsService.findById(req.params.id);
      }

      if (!comment) {
        res.status(HttpStatus.NotFound).send(createErrorMessages([{ field: 'id', message: 'Comment not found' }]));
        return;
      }

      res.status(HttpStatus.Ok).send(comment);
    } catch (error: unknown) {
      res.sendStatus(HttpStatus.InternalServerError);
    }
  }

  async putCommentHandler(req: Request, res: Response) {
    try {
      const comment = await this.commentsService.findById(req.params.id);

      if (!comment) {
        res.sendStatus(HttpStatus.NotFound);
        return;
      }

      if (req.user!.id !== comment.commentatorInfo.userId) {
        res.sendStatus(HttpStatus.Forbidden);
        return;
      }

      await this.commentsService.update(req.params.id, req.body);

      res.sendStatus(HttpStatus.NoContent);
    } catch (error: unknown) {
      res.sendStatus(HttpStatus.InternalServerError);
    }
  }

  async deleteCommentHandler(req: Request, res: Response) {
    try {
      const comment = await this.commentsService.findById(req.params.id);

      if (!comment) {
        res.status(HttpStatus.NotFound).send(createErrorMessages([{ field: 'id', message: 'Comment not found' }]));
        return;
      }

      if (req.user!.id !== comment.commentatorInfo.userId) {
        res.sendStatus(HttpStatus.Forbidden);
        return;
      }

      await this.commentsService.delete(req.params.id);

      res.sendStatus(HttpStatus.NoContent);
    } catch (error: unknown) {
      res.sendStatus(HttpStatus.InternalServerError);
    }
  }
}
