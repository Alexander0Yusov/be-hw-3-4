import { NextFunction, Request, Response } from 'express';
import { jwtService } from '../../adapters/jwt.service';
import { IdType } from '../../../core/types/id';

export const accessTokenNoStrict = async (req: Request, res: Response, next: NextFunction) => {
  if (req.headers.authorization) {
    const [authType, token] = req.headers.authorization.split(' ');

    const payload = await jwtService.verifyAccessToken(token);

    if (payload) {
      const { userId } = payload;

      req.user = { id: userId } as IdType;
      next();

      return;
    }
  }

  next();

  return;
};
