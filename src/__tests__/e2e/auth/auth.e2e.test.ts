import request from 'supertest';
import express from 'express';
import { setupApp } from '../../../setup-app';
import { HttpStatus } from '../../../core/types/HttpStatus';
import { AUTH_PATH, USERS_PATH } from '../../../core/paths/paths';
import { generateBasicAuthToken } from '../../utils/generateBasicAuthToken';
import { db } from '../../../db/mongo.db';
import { SETTINGS } from '../../../core/settings/settings';
import { createFakeUser } from '../../utils/users/create-fake-user';
import { runDb } from '../../../db/mongoose.db';
import mongoose from 'mongoose';

describe('Auth API', () => {
  const app = express();
  setupApp(app);

  beforeAll(async () => {
    await db.run(SETTINGS.MONGO_URL);
    await runDb(SETTINGS.MONGO_URL);

    await db.drop();
  });

  afterAll(async () => {
    await db.drop();

    await db.stop();
    await mongoose.disconnect();
  });

  it('should return status code 204; POST /auth/login', async () => {
    const newUser = createFakeUser('');

    await request(app)
      .post(USERS_PATH)
      .set('Authorization', generateBasicAuthToken())
      .send(newUser)
      .expect(HttpStatus.Created);

    await request(app)
      .post(AUTH_PATH + '/login')
      .send({ loginOrEmail: newUser.email, password: newUser.password })
      .expect(HttpStatus.Ok);
  });

  it('should return status code 400; POST /auth/registration', async () => {
    const newUser = createFakeUser('1');

    await request(app)
      .post(AUTH_PATH + '/registration')
      .send({ login: newUser.login, email: newUser.email, password: newUser.password })
      .expect(HttpStatus.NoContent);

    await request(app)
      .post(AUTH_PATH + '/registration')
      .send({ login: newUser.login, email: newUser.email, password: newUser.password })
      .expect(HttpStatus.BadRequest);
  });

  it('should send email with new code if user exists but not confirmed yet; status 204; POST /auth/registration-email-resending', async () => {
    const newUser = { login: 'yusovsky2', email: 'yusovsky2@gmail.com', password: 'qwerty123' };

    await request(app)
      .post(AUTH_PATH + '/registration')
      .send({ login: newUser.login, email: newUser.email, password: newUser.password })
      .expect(HttpStatus.NoContent);

    await request(app)
      .post(AUTH_PATH + '/registration-email-resending')
      .send({ email: newUser.email })
      .expect(HttpStatus.NoContent);
  });

  it('should confirm registration by email; status 204; POST auth/registration-confirmation', async () => {
    const user = await db.getCollections().userCollection.findOne({ 'accountData.email': 'yusovsky2@gmail.com' });

    await request(app)
      .post(AUTH_PATH + '/registration-confirmation')
      .send({ code: user?.emailConfirmation.confirmationCode })
      .expect(HttpStatus.NoContent);

    const updatedUser = await db
      .getCollections()
      .userCollection.findOne({ 'accountData.email': 'yusovsky2@gmail.com' });

    expect(updatedUser?.emailConfirmation.isConfirmed).toBeTruthy;
  });

  it('should return error if email already confirmed; status 400; POST auth/registration-email-resending', async () => {
    await request(app)
      .post(AUTH_PATH + '/registration-email-resending')
      .send({ email: 'yusovsky2@gmail.com' })
      .expect(HttpStatus.BadRequest);
  });

  it('should refresh token pair; POST /auth/refresh-token', async () => {
    const newUser = createFakeUser('f');

    await request(app)
      .post(USERS_PATH)
      .set('Authorization', generateBasicAuthToken())
      .send(newUser)
      .expect(HttpStatus.Created);

    const res = await request(app)
      .post(AUTH_PATH + '/login')
      .send({ loginOrEmail: newUser.email, password: newUser.password })
      .expect(HttpStatus.Ok);

    if (Array.isArray(res.headers['set-cookie'])) {
      const refreshToken = res.headers['set-cookie']
        .find((c) => c.startsWith('refreshToken='))
        ?.split(';')[0]
        .split('=')[1];

      const res2 = await request(app)
        .post(AUTH_PATH + '/refresh-token')
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .send({ accessToken: res.body.accessToken })
        .expect(HttpStatus.Ok);

      if (Array.isArray(res2.headers['set-cookie'])) {
        const refreshToken2 = res2.headers['set-cookie']
          .find((c) => c.startsWith('refreshToken='))
          ?.split(';')[0]
          .split('=')[1];
      }
    }
  });

  // тест рабочий но мешает
  // it('should login user 4 times from different browsers; POST /auth/login', async () => {
  //   const user = createFakeUser('q');

  //   await request(app)
  //     .post(USERS_PATH)
  //     .set('Authorization', generateBasicAuthToken())
  //     .send(user)
  //     .expect(HttpStatus.Created);

  //   const simulateClientLogin = async (email: string, password: string, userAgent: string, fakeIp: string) => {
  //     const res = await request(app)
  //       .post('/auth/login')
  //       .set('User-Agent', userAgent)
  //       .set('X-Forwarded-For', fakeIp)
  //       .send({ loginOrEmail: email, password });

  //     if (res.status !== 200) {
  //       return;
  //     }

  //     if (Array.isArray(res.headers['set-cookie'])) {
  //       return {
  //         accessToken: res.body.accessToken,
  //         refreshToken: res.headers['set-cookie']
  //           .find((c) => c.startsWith('refreshToken='))
  //           ?.split(';')[0]
  //           .split('=')[1],
  //       };
  //     }

  //     return;
  //   };

  //   const session_1 = await simulateClientLogin(user.email, user.password, 'Chrome', '192.168.1.10');
  //   const session_2 = await simulateClientLogin(user.email, user.password, 'Firefox', '192.168.1.11');
  //   const session_3 = await simulateClientLogin(user.email, user.password, 'Safari', '192.168.1.12');
  //   const session_4 = await simulateClientLogin(user.email, user.password, 'Edge', '192.168.1.13');

  //   const activeSessions = await request(app)
  //     .get('/security/devices')
  //     .set('Authorization', `Bearer ${session_1?.accessToken}`)
  //     .expect(HttpStatus.Ok);

  //   // меняем рефреш для сессии 1
  //   const refreshPair_1_2 = await request(app)
  //     .post(AUTH_PATH + '/refresh-token')
  //     .set('Cookie', [`refreshToken=${session_1?.refreshToken}`])
  //     .send({ accessToken: session_1?.accessToken })
  //     .expect(HttpStatus.Ok);

  //   let refreshToken_1_2;

  //   if (Array.isArray(refreshPair_1_2.headers['set-cookie'])) {
  //     refreshToken_1_2 = refreshPair_1_2.headers['set-cookie']
  //       .find((c) => c.startsWith('refreshToken='))
  //       ?.split(';')[0]
  //       .split('=')[1];
  //   }

  //   // проверяем список сессий после обновления токенов. дата активности 1 должна изм
  //   const activeSessions_2 = await request(app)
  //     .get('/security/devices')
  //     .set('Authorization', `Bearer ${refreshPair_1_2.body.accessToken}`)
  //     .expect(HttpStatus.Ok);

  //   // удаляем девайс 2 от имени девайса 1 и проверяем отсутствие
  //   let deviceId_2;

  //   if (Array.isArray(activeSessions_2.body)) {
  //     deviceId_2 = activeSessions_2.body.find((session) => session.title === 'Firefox').deviceId;
  //   }

  //   await request(app)
  //     .delete('/security/devices/' + `${deviceId_2}`)
  //     .set('Authorization', `Bearer ${refreshPair_1_2.body.accessToken}`)
  //     .expect(HttpStatus.NoContent);

  //   // проверяем список сессий после удаления 2. должно ост 3 шт.
  //   const activeSessions_3 = await request(app)
  //     .get('/security/devices')
  //     .set('Authorization', `Bearer ${refreshPair_1_2.body.accessToken}`)
  //     .expect(HttpStatus.Ok);

  //   // Делаем logout девайсом 3. Запрашиваем список девайсов (девайсом 1). В списке не должно быть девайса 3
  //   await request(app)
  //     .post(AUTH_PATH + '/logout')
  //     .set('Cookie', [`refreshToken=${session_3?.refreshToken}`])
  //     .set('Authorization', `Bearer ${session_3?.accessToken}`)
  //     .expect(HttpStatus.NoContent);

  //   const activeSessions_4 = await request(app)
  //     .get('/security/devices')
  //     .set('Authorization', `Bearer ${refreshPair_1_2.body.accessToken}`)
  //     .expect(HttpStatus.Ok);

  //   // Удаляем все оставшиеся девайсы (девайсом 1). Запрашиваем список девайсов. В списке должен содержаться только один (текущий) девайс
  //   await request(app)
  //     .delete('/security/devices')
  //     .set('Authorization', `Bearer ${refreshPair_1_2.body.accessToken}`)
  //     .set('Cookie', [`refreshToken=${refreshToken_1_2}`])
  //     .expect(HttpStatus.NoContent);

  //   const activeSessions_5 = await request(app)
  //     .get('/security/devices')
  //     .set('Authorization', `Bearer ${refreshPair_1_2.body.accessToken}`)
  //     .expect(HttpStatus.Ok);
  // });
});
