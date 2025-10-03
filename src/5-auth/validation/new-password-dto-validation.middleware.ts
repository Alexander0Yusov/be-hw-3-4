import { body } from 'express-validator';

export const newPasswordDtoValidationMiddleware = body('newPassword')
  .isString()
  .withMessage('Ожидается строка')
  .trim()
  .notEmpty()
  .withMessage('Пароль обязательный')
  .isLength({ min: 6, max: 20 })
  .withMessage('Минимум 6, максимум 20 символов');
