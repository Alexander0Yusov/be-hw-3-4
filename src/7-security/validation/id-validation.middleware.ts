import { param } from 'express-validator';

export const deviceIdValidationMiddleware = param('deviceId')
  .isString()
  .withMessage('Ожидается строка')
  .trim()
  .notEmpty()
  .withMessage('Айди обязательно');
