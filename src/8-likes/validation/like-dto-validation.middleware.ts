import { body } from 'express-validator';
import { LikeStatus } from '../types/like';

export const likeDtoValidationMiddleware = body('likeStatus')
  .isString()
  .withMessage('Ожидается строка')
  .trim()
  .notEmpty()
  .withMessage('Контент обязательный')
  .isIn(Object.values(LikeStatus))
  .withMessage(`Допустимые значения: ${Object.values(LikeStatus).join(', ')}`);
