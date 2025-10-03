import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { SessionsQwRepository } from '../../qw-repository/sessions-qw-repository';
import { HttpStatus } from '../../../core/types/HttpStatus';
import { SessionsService } from '../../application/sessions.service';
import { createErrorMessages } from '../../../core/utils/error.utils';
import { AuthService } from '../../../5-auth/domain/auth.service';

@injectable()
export class SecurityController {
  constructor(
    @inject(SessionsQwRepository) private sessionsQwRepository: SessionsQwRepository,
    @inject(SessionsService) private sessionsService: SessionsService,
    @inject(AuthService) private authService: AuthService,
  ) {}

  async getActiveSessionsHandler(req: Request, res: Response) {
    try {
      const activeSessions = await this.sessionsQwRepository.findMany(req.user!.id);

      res.status(HttpStatus.Ok).send(activeSessions);
    } catch (error: unknown) {
      res.sendStatus(HttpStatus.InternalServerError);
    }
  }

  async deleteSessionsExcludeCurrentHandler(req: Request, res: Response) {
    try {
      const deviceId = req.device!.id;
      const userId = req.user!.id;

      if (await this.sessionsService.deleteAllExceptCurrent(userId, deviceId)) {
        res.sendStatus(HttpStatus.NoContent);
        return;
      }

      res.sendStatus(HttpStatus.Forbidden);
    } catch (error: unknown) {
      res.sendStatus(HttpStatus.InternalServerError);
    }
  }

  async deleteSessionByIdHandler(req: Request, res: Response) {
    try {
      const session = await this.sessionsService.findById(req.params.deviceId);

      if (!session) {
        res.status(HttpStatus.NotFound).send(createErrorMessages([{ field: 'deviceId', message: 'Device not found' }]));
        return;
      }

      if (req.user!.id !== session.userId) {
        res.status(HttpStatus.Forbidden).send(createErrorMessages([{ field: 'user', message: 'Forbidden' }]));
        return;
      }

      await this.sessionsService.deleteOne(session.deviceId, session.userId);

      await this.authService.logoutDeviceById(session.deviceId);

      res.sendStatus(HttpStatus.NoContent);
      return;
    } catch (error: unknown) {
      res.sendStatus(HttpStatus.InternalServerError);
    }
  }
}
