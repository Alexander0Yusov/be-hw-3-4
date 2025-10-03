import * as jwt from 'jsonwebtoken';
import { SETTINGS } from '../../core/settings/settings';

export const jwtService = {
  async createAccessToken(userId: string): Promise<string> {
    return jwt.sign({ userId }, SETTINGS.AC_SECRET, {
      expiresIn: Number(SETTINGS.AC_TIME),
    });
  },

  async createRefreshToken(userId: string, deviceId: string): Promise<string> {
    const iat = Math.floor(Date.now() / 1000); // секунды

    return jwt.sign({ userId, deviceId, iat }, SETTINGS.REFRESH_SECRET, {
      expiresIn: Number(SETTINGS.REFRESH_TIME) || '7d',
    });
  },

  async decodeToken(token: string): Promise<any> {
    try {
      return jwt.decode(token);
    } catch (e: unknown) {
      console.error("Can't decode token", e);
      return null;
    }
  },

  async isTokenExpired(token: string): Promise<boolean> {
    const decoded = jwt.decode(token) as { exp?: number };

    if (!decoded?.exp) return true;
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
  },

  async verifyAccessToken(token: string): Promise<{ userId: string } | null> {
    try {
      return jwt.verify(token, SETTINGS.AC_SECRET) as { userId: string };
    } catch (error) {
      console.error('Access token verification failed');
      return null;
    }
  },

  async verifyRefreshToken(token: string): Promise<{ userId: string; deviceId: string; iat: number } | null> {
    try {
      return jwt.verify(token, SETTINGS.REFRESH_SECRET) as { userId: string; deviceId: string; iat: number };
    } catch (error) {
      console.error('Refresh token verification failed');
      return null;
    }
  },
};
