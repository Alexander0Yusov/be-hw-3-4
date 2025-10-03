import { Router } from 'express';
import { superAdminGuardMiddleware } from '../../core/middlewares/validation/super-admin-guard.middleware';
import { errorsCatchMiddleware } from '../../core/middlewares/validation/errors-catch.middleware';
import { userDtoValidationMiddleware } from '../validation/user-dto-validation.middleware';
import { paginationAndSortingValidation } from '../../core/middlewares/validation/query-pagination-sorting.validation-middleware';
import { UserSortField } from './input/user-sort-field';
import { idValidationMiddleware } from '../../core/middlewares/validation/id-validation.middleware';
import { query } from 'express-validator';
import { container } from '../../composition-root';
import { UsersController } from './controller/users-controller';

export const usersRouter = Router({});

const controller = container.get<UsersController>(UsersController);

usersRouter.get(
  '',
  paginationAndSortingValidation(UserSortField),
  query('searchLoginTerm').optional().trim(),
  query('searchEmailTerm').optional().trim(),
  controller.getUserListHandler.bind(controller),
);

usersRouter.post(
  '',
  superAdminGuardMiddleware,
  userDtoValidationMiddleware,
  errorsCatchMiddleware,
  controller.postUserHandler.bind(controller),
);

usersRouter.delete(
  '/:id',
  superAdminGuardMiddleware,
  idValidationMiddleware,
  errorsCatchMiddleware,
  controller.deleteUserHandler.bind(controller),
);
