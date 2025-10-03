import { Router } from 'express';
import { deviceIdValidationMiddleware } from '../validation/id-validation.middleware';
import { errorsCatchMiddleware } from '../../core/middlewares/validation/errors-catch.middleware';
import { refreshTokenGuard } from '../../5-auth/router/guards/refresh.token.guard';
import { SecurityController } from './controller/security.controller';
import { container } from '../../composition-root';

export const securityRouter = Router({});

const controller = container.get<SecurityController>(SecurityController);

securityRouter.get('/devices', refreshTokenGuard, controller.getActiveSessionsHandler.bind(controller));

securityRouter.delete('/devices', refreshTokenGuard, controller.deleteSessionsExcludeCurrentHandler.bind(controller));

securityRouter.delete(
  '/devices/:deviceId',
  refreshTokenGuard,
  deviceIdValidationMiddleware,
  errorsCatchMiddleware,
  controller.deleteSessionByIdHandler.bind(controller),
);
