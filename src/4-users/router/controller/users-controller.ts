import { inject, injectable } from 'inversify';
import { UsersService } from '../../application/users.service';
import { matchedData } from 'express-validator';
import { setDefaultSortAndPaginationIfNotExist } from '../../../core/helpers/set-default-sort-and-pagination';
import { UsersQwRepository } from '../../qw-repository/users-qw-repository';
import { UserQueryInput } from '../input/user-query.input';
import { HttpStatus } from '../../../core/types/HttpStatus';
import { Request, Response } from 'express';
import { UserInputModel } from '../../types/user-iput-model';
import { createErrorMessages } from '../../../core/utils/error.utils';

@injectable()
export class UsersController {
  constructor(
    @inject(UsersService) private usersService: UsersService,
    @inject(UsersQwRepository) private usersQwRepository: UsersQwRepository,
  ) {}

  async getUserListHandler(req: Request, res: Response) {
    try {
      const queryData = matchedData(req, { locations: ['query'] });
      const queryInput = setDefaultSortAndPaginationIfNotExist(queryData);

      const searchResult = await this.usersQwRepository.findMany(queryInput as UserQueryInput);

      res.status(HttpStatus.Ok).send(searchResult);
    } catch (error: unknown) {
      res.sendStatus(HttpStatus.InternalServerError);
    }
  }

  async postUserHandler(req: Request<{}, {}, UserInputModel>, res: Response) {
    try {
      const existsUserId = await this.usersQwRepository.findByEmailOrLogin(req.body.login || req.body.email);

      if (existsUserId) {
        res.status(HttpStatus.BadRequest).send(
          createErrorMessages([
            {
              field: 'email or login',
              message: 'the email address or login is not unique',
            },
          ]),
        );

        return;
      }

      const createdUserId = await this.usersService.create(req.body);
      const user = await this.usersQwRepository.findById(createdUserId);

      res.status(HttpStatus.Created).send(user);
    } catch (error: unknown) {
      res.sendStatus(HttpStatus.InternalServerError);
    }
  }

  async deleteUserHandler(req: Request, res: Response) {
    try {
      const isExistsUser = await this.usersQwRepository.findById(req.params.id);

      if (!isExistsUser) {
        res.status(HttpStatus.NotFound).send(createErrorMessages([{ field: 'id', message: 'User not found' }]));
        return;
      }

      await this.usersService.delete(req.params.id);

      res.sendStatus(HttpStatus.NoContent);
    } catch (error: unknown) {
      res.sendStatus(HttpStatus.InternalServerError);
    }
  }
}
