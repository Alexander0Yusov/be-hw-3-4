import { Router } from 'express';
import { errorsCatchMiddleware } from '../../core/middlewares/validation/errors-catch.middleware';
import { accessTokenGuard } from './guards/access.token.guard';
import { loginOrEmailDtoValidationMiddleware } from '../validation/login-or-email-dto-validation.middleware';
import { passwordDtoValidationMiddleware } from '../validation/password-dto-validation.middleware';
import { userDtoValidationMiddleware } from '../../4-users/validation/user-dto-validation.middleware';
import { confirmationCodeDtoValidationMiddleware } from '../validation/confirmation-code-dto-validation.middleware';
import { emailDtoValidationMiddleware } from '../validation/email-dto-validation.middleware';
import { logAndRateLimitMiddleware } from '../../core/middlewares/log-and-limit/log-and-rate-limit.middleware';
import { container } from '../../composition-root';
import { AuthController } from './controller/auth-controller';
import { newPasswordDtoValidationMiddleware } from '../validation/new-password-dto-validation.middleware';
import { recoveryCodeDtoValidationMiddleware } from '../validation/recovery-code-dto-validation.middleware';

export const authRouter = Router({});

const controller = container.get<AuthController>(AuthController);

authRouter.post(
  '/new-password',
  logAndRateLimitMiddleware,
  newPasswordDtoValidationMiddleware,
  recoveryCodeDtoValidationMiddleware,
  errorsCatchMiddleware,
  controller.postAuthNewPasswordHandler.bind(controller),
);

authRouter.post(
  '/password-recovery',
  emailDtoValidationMiddleware,
  logAndRateLimitMiddleware,
  errorsCatchMiddleware,
  controller.postAuthPasswordRecoveryHandler.bind(controller),
);

authRouter.post(
  '/login',
  loginOrEmailDtoValidationMiddleware,
  passwordDtoValidationMiddleware,
  logAndRateLimitMiddleware,
  errorsCatchMiddleware,
  controller.postAuthLoginHandler.bind(controller),
);

authRouter.get('/me', accessTokenGuard, controller.getAuthMeHandler.bind(controller));

authRouter.post(
  '/registration',
  userDtoValidationMiddleware,
  logAndRateLimitMiddleware,
  errorsCatchMiddleware,
  controller.postAuthRegistrationHandler.bind(controller),
);

authRouter.post(
  '/registration-confirmation',
  confirmationCodeDtoValidationMiddleware,
  logAndRateLimitMiddleware,
  errorsCatchMiddleware,
  controller.postAuthRegistrationConfirmationHandler.bind(controller),
);

authRouter.post(
  '/registration-email-resending',
  emailDtoValidationMiddleware,
  logAndRateLimitMiddleware,
  errorsCatchMiddleware,
  controller.postAuthRegistrationEmailResendingHandler.bind(controller),
);

authRouter.post('/refresh-token', controller.postAuthRefreshTokenHandler.bind(controller));

authRouter.post('/logout', controller.postAuthLogoutHandler.bind(controller));
