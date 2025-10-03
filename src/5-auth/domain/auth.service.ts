import { WithId } from 'mongodb';
import { jwtService } from '../adapters/jwt.service';
import { ResultStatus } from '../../core/result/resultCode';
import { Result } from '../../core/result/result.type';
import { bcryptService } from '../adapters/bcrypt.service';
import { add, addSeconds } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

import { UsersRepository } from '../../4-users/repository/users.repository';
import { User } from '../../4-users/types/user';
import { UsersService } from '../../4-users/application/users.service';
import { nodemailerService } from '../adapters/nodemailer.service';
import { emailExamples } from '../adapters/email-examples';
import { SETTINGS } from '../../core/settings/settings';
import { SessionsService } from '../../7-security/application/sessions.service';
import { inject, injectable } from 'inversify';

@injectable()
export class AuthService {
  constructor(
    @inject(UsersRepository) private usersRepository: UsersRepository,
    @inject(UsersService) private usersService: UsersService,
    @inject(SessionsService) private sessionsService: SessionsService,
  ) {}

  async loginUser(
    loginOrEmail: string,
    password: string,
  ): Promise<Result<{ accessToken: string; refreshToken: string } | null>> {
    const result = await this.checkUserCredentials(loginOrEmail, password);

    if (result.status !== ResultStatus.Success) {
      return {
        status: ResultStatus.Unauthorized,
        errorMessage: 'Unauthorized',
        extensions: [{ field: 'loginOrEmail', message: 'Wrong credentials' }],
        data: null,
      };
    }

    if (result.data) {
      const deviceId = uuidv4();

      const accessToken = await jwtService.createAccessToken(result.data._id.toString());
      const refreshToken = await jwtService.createRefreshToken(result.data._id.toString(), deviceId);

      const refreshTokenData = {
        value: refreshToken,
        createdAt: new Date(),
        expiresAt: addSeconds(new Date(), Number(SETTINGS.REFRESH_TIME)),
        isRevoked: false,
        deviceId,
      };

      await this.usersRepository.setRefreshTokenById(result.data!._id, refreshTokenData);

      return {
        status: ResultStatus.Success,
        data: { accessToken, refreshToken },
        extensions: [],
      };
    }

    return {
      status: ResultStatus.Unauthorized,
      errorMessage: 'Unauthorized',
      extensions: [{ field: 'loginOrEmail', message: 'Wrong credentials' }],
      data: null,
    };
  }

  async checkUserCredentials(loginOrEmail: string, password: string): Promise<Result<WithId<User> | null>> {
    const user = await this.usersRepository.findByEmailOrLogin(loginOrEmail);

    if (!user)
      return {
        status: ResultStatus.NotFound,
        data: null,
        errorMessage: 'Not Found',
        extensions: [{ field: 'loginOrEmail', message: 'Not Found' }],
      };

    const isPassCorrect = await bcryptService.checkPassword(password, user.accountData.passwordHash);

    if (!isPassCorrect)
      return {
        status: ResultStatus.BadRequest,
        data: null,
        errorMessage: 'Bad Request',
        extensions: [{ field: 'password', message: 'Wrong password' }],
      };

    return {
      status: ResultStatus.Success,
      data: user,
      extensions: [],
    };
  }

  async registerUser(login: string, email: string, password: string): Promise<Result<WithId<User> | null>> {
    const existsLogin = await this.usersRepository.findByEmailOrLogin(login);

    if (existsLogin) {
      return {
        status: ResultStatus.BadRequest,
        data: null,
        errorMessage: 'Bad Request',
        extensions: [{ field: 'login', message: 'Login already exists' }],
      };
    }

    const existsEmail = await this.usersRepository.findByEmailOrLogin(email);

    if (existsEmail) {
      return {
        status: ResultStatus.BadRequest,
        data: null,
        errorMessage: 'Bad Request',
        extensions: [{ field: 'email', message: 'Email already exists' }],
      };
    }

    const userId = await this.usersService.create({ login, email, password });
    const user = await this.usersRepository.findById(userId);

    try {
      await nodemailerService.sendEmail(
        user!.accountData.email,
        user!.emailConfirmation.confirmationCode,
        emailExamples.registrationEmail,
      );

      return {
        status: ResultStatus.NoContent,
        data: user,
        extensions: [],
      };
    } catch (error) {
      return {
        status: ResultStatus.BadRequest,
        data: null,
        errorMessage: 'Bad Request',
        extensions: [{ field: 'Internal error', message: 'Mail service error' }],
      };
    }
  }

  async confirmEmail(code: string): Promise<Result<true | null>> {
    const user = await this.usersRepository.findByCode(code);

    if (!user) {
      return {
        status: ResultStatus.BadRequest,
        errorMessage: 'BadRequest',
        extensions: [{ field: 'code', message: 'The confirmation code is not found' }],
        data: null,
      };
    }

    if (user.emailConfirmation.expirationDate < new Date() || user.emailConfirmation.isConfirmed) {
      return {
        status: ResultStatus.BadRequest,
        errorMessage: 'BadRequest',
        extensions: [{ field: 'code', message: 'The confirmation code expired or already been applied' }],
        data: null,
      };
    }

    await this.usersRepository.confirmEmail(code);

    return {
      status: ResultStatus.NoContent,
      data: true,
      extensions: [],
    };
  }

  async resendConfirmationCode(email: string): Promise<Result<true | null>> {
    const user = await this.usersRepository.findByEmailOrLogin(email);

    if (!user) {
      return {
        status: ResultStatus.BadRequest,
        errorMessage: 'BadRequest',
        extensions: [{ field: 'email', message: 'Email not found' }],
        data: null,
      };
    }

    if (user.emailConfirmation.isConfirmed) {
      return {
        status: ResultStatus.BadRequest,
        errorMessage: 'BadRequest',
        extensions: [{ field: 'email', message: 'Email already been confirmed' }],
        data: null,
      };
    }

    const newCode = uuidv4();

    // устанавливаем новый код и время экспирации
    await this.usersRepository.prolongationConfirmationCode(email, newCode, add(new Date(), { hours: 1 }));

    // отправляем письмо на почту
    await nodemailerService.sendEmail(email, newCode, emailExamples.registrationEmail);

    return {
      status: ResultStatus.NoContent,
      data: true,
      extensions: [],
    };
  }

  async updateTokensPair(refreshToken: string): Promise<Result<Record<string, string> | null>> {
    const user = await this.usersRepository.findByRefreshToken(refreshToken);

    // нет токена в базе или он отозван
    if (!user || user.refreshTokens.find((tokenData) => tokenData.value === refreshToken)?.isRevoked === true) {
      return {
        status: ResultStatus.Unauthorized,
        errorMessage: 'Unauthorized',
        extensions: [{ field: 'refreshToken', message: 'Refresh token no valid' }],
        data: null,
      };
    }

    // если протух
    if (await jwtService.isTokenExpired(refreshToken)) {
      return {
        status: ResultStatus.Unauthorized,
        errorMessage: 'Unauthorized',
        extensions: [{ field: 'refreshToken', message: 'Refresh token already been expired' }],
        data: null,
      };
    }

    // меняем статус рефреш токена на негодный
    await this.usersRepository.setStatusIsRevokedForRefreshToken(refreshToken);

    // находим сессию и берем девайс айди
    const decodedRefreshToken = (await jwtService.decodeToken(refreshToken)) as unknown as {
      userId: string;
      deviceId: string;
    };

    // генерим новые и укладываем в базу только рефреш токен
    const newAccessToken = await jwtService.createAccessToken(decodedRefreshToken.userId);
    const newRefreshToken = await jwtService.createRefreshToken(
      decodedRefreshToken.userId,
      decodedRefreshToken.deviceId,
    );

    const decodedNewRefreshToken = (await jwtService.decodeToken(newRefreshToken)) as unknown as {
      iat: number;
      exp: number;
    };

    const refreshTokenData = {
      value: newRefreshToken,
      createdAt: new Date(decodedNewRefreshToken.iat * 1000),
      expiresAt: addSeconds(new Date(decodedNewRefreshToken.exp * 1000), Number(SETTINGS.REFRESH_TIME)),
      isRevoked: false,
    };

    await this.usersRepository.setRefreshTokenById(user._id, refreshTokenData);

    return {
      status: ResultStatus.Success,
      data: { refreshToken: newRefreshToken, accessToken: newAccessToken },
      extensions: [],
    };
  }

  async logoutUser(refreshToken: string): Promise<Result<true | null>> {
    const user = await this.usersRepository.findByRefreshToken(refreshToken);

    const refreshTokenData = user!.refreshTokens.find((tokenData) => tokenData.value === refreshToken);

    // нет токена в базе или он отозван
    if (!user || refreshTokenData?.isRevoked === true) {
      return {
        status: ResultStatus.Unauthorized,
        errorMessage: 'Unauthorized',
        extensions: [{ field: 'refreshToken', message: 'Refresh token not found' }],
        data: null,
      };
    }

    // если протух
    if (await jwtService.isTokenExpired(refreshToken)) {
      return {
        status: ResultStatus.Unauthorized,
        errorMessage: 'Unauthorized',
        extensions: [{ field: 'refreshToken', message: 'Refresh token already been expired' }],
        data: null,
      };
    }

    // меняем статус рефреш токена на негодный
    await this.usersRepository.setStatusIsRevokedForRefreshToken(refreshToken);
    await this.sessionsService.deleteOne(refreshTokenData?.deviceId || '', user._id.toString());

    return {
      status: ResultStatus.NoContent,
      data: true,
      extensions: [],
    };
  }

  async logoutDeviceById(deviceId: string): Promise<Result<true | null>> {
    const user = await this.usersRepository.findByDeviceId(deviceId);

    const refreshTokenData = user!.refreshTokens.find((tokenData) => tokenData.deviceId === deviceId);

    // нет токена в базе или он отозван
    if (!user || refreshTokenData!.isRevoked === true) {
      return {
        status: ResultStatus.Unauthorized,
        errorMessage: 'Unauthorized',
        extensions: [{ field: 'refreshToken', message: 'Refresh token not found' }],
        data: null,
      };
    }

    // если протух
    if (await jwtService.isTokenExpired(refreshTokenData!.value)) {
      return {
        status: ResultStatus.Unauthorized,
        errorMessage: 'Unauthorized',
        extensions: [{ field: 'refreshToken', message: 'Refresh token already been expired' }],
        data: null,
      };
    }

    // меняем статус рефреш токена на негодный
    await this.usersRepository.setStatusIsRevokedForRefreshToken(refreshTokenData!.value);

    return {
      status: ResultStatus.NoContent,
      data: true,
      extensions: [],
    };
  }

  //
  async sendPasswordRecoveryCode(email: string): Promise<Result<true | null>> {
    const user = await this.usersRepository.findByEmailOrLogin(email);

    if (!user) {
      return {
        status: ResultStatus.NoContent,
        errorMessage: 'NoContent',
        extensions: [{ field: 'email', message: 'Email not found' }],
        data: null,
      };
    }

    const newCode = uuidv4();

    // устанавливаем новый код и время экспирации
    await this.usersRepository.setPasswordRecoveryCode(email, newCode, add(new Date(), { hours: 1 }));

    // отправляем письмо на почту
    await nodemailerService.sendEmail(email, newCode, emailExamples.passwordRecoveryEmail);

    return {
      status: ResultStatus.NoContent,
      data: true,
      extensions: [],
    };
  }

  async newPasswordApplying(recoveryCode: string, newPassword: string): Promise<Result<true | null>> {
    const user = await this.usersRepository.findByRecoveryCode(recoveryCode);

    if (!user) {
      return {
        status: ResultStatus.BadRequest,
        errorMessage: 'BadRequest',
        extensions: [{ field: 'recoveryCode', message: 'The recovery code is not found' }],
        data: null,
      };
    }

    if (user.passwordRecovery.expirationDate < new Date() || user.passwordRecovery.isUsed) {
      return {
        status: ResultStatus.BadRequest,
        errorMessage: 'BadRequest',
        extensions: [{ field: 'recoveryCode', message: 'The recovery code expired or already been applied' }],
        data: null,
      };
    }

    const newPasswordHash = await bcryptService.generateHash(newPassword);

    await this.usersRepository.recoveryPassword(recoveryCode, newPasswordHash);

    return {
      status: ResultStatus.NoContent,
      data: true,
      extensions: [],
    };
  }
}
