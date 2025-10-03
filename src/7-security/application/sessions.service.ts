import { jwtService } from '../../5-auth/adapters/jwt.service';
import { DeviceSession } from '../types/device-session';
import { SessionsRepository } from '../repository/sessions.repository';
import { UsersRepository } from '../../4-users/repository/users.repository';
import { injectable, inject } from 'inversify';

@injectable()
export class SessionsService {
  constructor(
    @inject(SessionsRepository) private sessionsRepository: SessionsRepository,
    @inject(UsersRepository) private usersRepository: UsersRepository,
  ) {}

  async createSession(refreshToken: string, ip: string, deviceName: string): Promise<string> {
    const decoded = (await jwtService.decodeToken(refreshToken)) as unknown as {
      userId: string;
      deviceId: string;
      iat: number;
      exp: number;
    };

    const newSession: DeviceSession = {
      userId: decoded.userId,
      deviceId: decoded.deviceId,
      ip,
      deviceName,
      lastActiveDate: new Date(decoded.iat * 1000),
      expiresAt: new Date(decoded.exp * 1000),
    };

    return await this.sessionsRepository.create(newSession);
  }

  async update(incomeRefreshToken: string, newRefreshToken: string) {
    const incomeDecodedToken = (await jwtService.decodeToken(incomeRefreshToken)) as unknown as {
      deviceId: string;
      iat: number;
    };

    const newDecodedToken = (await jwtService.decodeToken(newRefreshToken)) as unknown as {
      iat: number;
      exp: number;
    };

    await this.sessionsRepository.update(
      incomeDecodedToken.deviceId,
      new Date(incomeDecodedToken.iat * 1000),
      new Date(newDecodedToken.iat * 1000),
      new Date(newDecodedToken.exp * 1000),
    );
  }

  async deleteAllExceptCurrent(userId: string, deviceId: string): Promise<boolean> {
    const user = await this.usersRepository.findById(userId);

    const newRefreshTokens = user!.refreshTokens.map((refreshTokenDataItem) => {
      if (refreshTokenDataItem.deviceId !== deviceId) {
        refreshTokenDataItem.isRevoked = true;
      }

      return refreshTokenDataItem;
    });

    await this.usersRepository.setRefreshTokenArray(userId, newRefreshTokens);

    return await this.sessionsRepository.deleteManyExceptCurrent(userId, deviceId);
  }

  async deleteOne(deviceId: string, userId: string) {
    return await this.sessionsRepository.deleteByDeviceIdAndUserId(deviceId, userId);
  }

  async findById(deviceId: string) {
    return await this.sessionsRepository.findById(deviceId);
  }
}
