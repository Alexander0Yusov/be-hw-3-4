import { NextFunction, Request, Response } from 'express';
import { jwtService } from '../../adapters/jwt.service';
import { IdType } from '../../../core/types/id';

export const refreshTokenGuard = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.refreshToken;

  if (!token) return res.sendStatus(401);

  const payload = await jwtService.verifyRefreshToken(token);

  if (payload) {
    const { userId, deviceId } = payload;

    req.user = { id: userId } as IdType;
    req.device = { id: deviceId } as IdType;

    next();

    return;
  }

  res.sendStatus(401);

  return;
};
