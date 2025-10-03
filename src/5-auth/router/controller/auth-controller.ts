import { Request, Response } from 'express';
import { AuthService } from '../../domain/auth.service';
import { inject, injectable } from 'inversify';
import { resultCodeToHttpException } from '../../../core/result/resultCodeToHttpException';
import { RegistrationInputModel } from '../../types/registration-input-model';
import { createErrorMessages } from '../../../core/utils/error.utils';
import { RequestWithUserId } from '../../../core/types/requests';
import { IdType } from '../../../core/types/id';
import { ResultStatus } from '../../../core/result/resultCode';
import { SessionsService } from '../../../7-security/application/sessions.service';
import { AuthInputModel } from '../../types/auth-iput-model';
import { HttpStatus } from '../../../core/types/HttpStatus';
import { UsersQwRepository } from '../../../4-users/qw-repository/users-qw-repository';

@injectable()
export class AuthController {
  constructor(
    @inject(AuthService) private authService: AuthService,
    @inject(SessionsService) private sessionsService: SessionsService,
    @inject(UsersQwRepository) private usersQwRepository: UsersQwRepository,
  ) {}

  async postAuthRegistrationHandler(req: Request<{}, {}, RegistrationInputModel>, res: Response) {
    const { login, email, password } = req.body;

    const newUser = await this.authService.registerUser(login, email, password);

    if (newUser.data) {
      res.sendStatus(resultCodeToHttpException(newUser.status));
      return;
    }

    res
      .status(resultCodeToHttpException(newUser.status))
      .send(
        createErrorMessages([
          { field: newUser?.extensions[0]?.field || '0', message: newUser?.extensions[0]?.message || '0' },
        ]),
      );
  }

  async postAuthRegistrationEmailResendingHandler(req: Request<{}, {}, { email: string }>, res: Response) {
    const { email } = req.body;

    const result = await this.authService.resendConfirmationCode(email);

    if (result.data) {
      res.sendStatus(resultCodeToHttpException(result.status));
      return;
    }

    res
      .status(resultCodeToHttpException(result.status))
      .send(createErrorMessages([{ field: 'email', message: result.extensions[0]?.message }]));
  }

  async postAuthRegistrationConfirmationHandler(req: Request<{}, {}, { code: string }>, res: Response) {
    const { code } = req.body;

    const result = await this.authService.confirmEmail(code);

    if (result.data) {
      res.sendStatus(resultCodeToHttpException(result.status));
      return;
    }

    res
      .status(resultCodeToHttpException(result.status))
      .send(createErrorMessages([{ field: 'code', message: result.extensions[0]?.message }]));
  }

  async postAuthRefreshTokenHandler(req: RequestWithUserId<IdType>, res: Response) {
    const incomeRefreshToken = req.cookies.refreshToken;

    const result = await this.authService.updateTokensPair(incomeRefreshToken);

    if (result.status !== ResultStatus.Success) {
      return res.status(resultCodeToHttpException(result.status)).send(result.extensions);
    }

    // обновление сессии. поиск по девайсу и дате выдачи. обновление дат
    await this.sessionsService.update(incomeRefreshToken, result.data!.refreshToken);

    res.cookie('refreshToken', result!.data!.refreshToken, { httpOnly: true, secure: true });

    res.status(resultCodeToHttpException(result.status)).send({ accessToken: result.data!.accessToken });
  }

  async postAuthLogoutHandler(req: RequestWithUserId<IdType>, res: Response) {
    const incomeRefreshToken = req.cookies.refreshToken;

    const result = await this.authService.logoutUser(incomeRefreshToken);

    if (result.status !== ResultStatus.NoContent) {
      return res.status(resultCodeToHttpException(result.status)).send(result.extensions);
    }

    res.cookie('refreshToken', '', { httpOnly: true, secure: true, expires: new Date(0) });

    res.sendStatus(resultCodeToHttpException(result.status));
  }

  async postAuthLoginHandler(req: Request<{}, {}, AuthInputModel>, res: Response) {
    const ip = req.ip; // || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const device_name = req.get('user-agent') || 'Unknown device';

    const { loginOrEmail, password } = req.body;

    const result = await this.authService.loginUser(loginOrEmail, password);

    if (result.status !== ResultStatus.Success) {
      return res.status(resultCodeToHttpException(result.status)).send(result.extensions);
    }

    await this.sessionsService.createSession(result.data!.refreshToken, ip!, device_name);

    res.cookie('refreshToken', result.data!.refreshToken, { httpOnly: true, secure: true });

    return res.status(HttpStatus.Ok).send({ accessToken: result.data!.accessToken });
  }

  async getAuthMeHandler(req: RequestWithUserId<IdType>, res: Response) {
    const userId = req.user?.id as string;

    if (!userId) return res.sendStatus(HttpStatus.Unauthorized);

    const me = await this.usersQwRepository.findById(userId);

    return res.status(HttpStatus.Ok).send({
      email: me?.email,
      login: me?.login,
      userId: me?.id,
    });
  }

  async postAuthPasswordRecoveryHandler(req: Request, res: Response) {
    const { email } = req.body;

    const result = await this.authService.sendPasswordRecoveryCode(email);

    if (result.data) {
      res.sendStatus(resultCodeToHttpException(result.status));
      return;
    }

    res
      .status(resultCodeToHttpException(result.status))
      .send(createErrorMessages([{ field: 'email', message: result.extensions[0]?.message }]));
  }

  async postAuthNewPasswordHandler(req: Request, res: Response) {
    const { recoveryCode, newPassword } = req.body;

    const result = await this.authService.newPasswordApplying(recoveryCode, newPassword);

    if (result.data) {
      res.sendStatus(resultCodeToHttpException(result.status));
      return;
    }

    res
      .status(resultCodeToHttpException(result.status))
      .send(createErrorMessages([{ field: 'recoveryCode', message: result.extensions[0]?.message }]));
  }
}
