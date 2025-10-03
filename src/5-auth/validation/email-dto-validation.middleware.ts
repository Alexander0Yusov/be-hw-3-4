import { body } from 'express-validator';

export const emailDtoValidationMiddleware = body('email')
  .trim()
  .isString()
  .withMessage('Ожидается строка')
  .notEmpty()
  .withMessage('Имейл обязательный')
  .matches('^[\\w\\-\\.\\+]+@([\\w\\-]+\\.)+[\\w\\-]{2,4}$')
  .withMessage('Невалидный формат');

// .matches('^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$') // нововведение с 3/2 домашки
