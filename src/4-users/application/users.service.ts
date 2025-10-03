import bcrypt from 'bcrypt';
import { add } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { UsersRepository } from '../repository/users.repository';
import { User } from '../types/user';
import { UserInputModel } from '../types/user-iput-model';
import { inject, injectable } from 'inversify';

@injectable()
export class UsersService {
  constructor(@inject(UsersRepository) private usersRepository: UsersRepository) {}

  async create(dto: UserInputModel): Promise<string> {
    const saltRounds = 10;

    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const newUser: User = {
      accountData: {
        login: dto.login,
        email: dto.email,
        passwordHash,
        createdAt: new Date(),
      },
      refreshTokens: [],
      loginAttempts: [],
      emailConfirmation: {
        sentEmails: [],
        confirmationCode: uuidv4(),
        expirationDate: add(new Date(), { hours: 1 }),
        isConfirmed: false,
      },
      passwordRecovery: {
        sentEmails: [],
        confirmationCode: '',
        expirationDate: new Date(),
        isUsed: true,
      },
    };

    const newUserId = await this.usersRepository.create(newUser);

    return newUserId;
  }

  async delete(id: string): Promise<void> {
    await this.usersRepository.delete(id);
    return;
  }
}
