import { body } from 'express-validator';

export const recoveryCodeDtoValidationMiddleware = body('recoveryCode')
  .isString()
  .withMessage('Ожидается строка')
  .trim()
  .notEmpty()
  .withMessage('Код подтверждения обязательный');
