import { inject, injectable } from 'inversify';
import { LikesService } from '../application/likes.service';
import { Request, Response } from 'express';
import { HttpStatus } from '../../core/types/HttpStatus';
import { resultCodeToHttpException } from '../../core/result/resultCodeToHttpException';

@injectable()
export class LikesController {
  constructor(@inject(LikesService) private likesService: LikesService) {}

  async createOrUpdateLikeStatus(req: Request, res: Response) {
    try {
      const parentId = req.params.id;
      const newStatus = req.body.likeStatus;
      const userId = req.user!.id;

      const updatedLikeStatus = await this.likesService.createOrUpdate(parentId, newStatus, userId);

      if (!updatedLikeStatus.data) {
        res.sendStatus(resultCodeToHttpException(updatedLikeStatus.status));
        return;
      }

      res.status(resultCodeToHttpException(updatedLikeStatus.status)).send(updatedLikeStatus.data);
      return;
    } catch (error: unknown) {
      res.sendStatus(HttpStatus.InternalServerError);
    }
  }
}
