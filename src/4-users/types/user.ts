import { RefreshTokenData } from '../../5-auth/types/refresh-token';

export type User = {
  accountData: {
    login: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
  };
  emailConfirmation: {
    sentEmails: [];
    confirmationCode: string;
    expirationDate: Date;
    isConfirmed: boolean;
  };
  passwordRecovery: {
    sentEmails: [];
    confirmationCode: string;
    expirationDate: Date;
    isUsed: boolean;
  };
  refreshTokens: RefreshTokenData[];
  loginAttempts: [];
};
