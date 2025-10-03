import request from 'supertest';
import express from 'express';
import { setupApp } from '../../../setup-app';
import { HttpStatus } from '../../../core/types/HttpStatus';
import { AUTH_PATH, BLOGS_PATH, COMMENTS_PATH, POSTS_PATH, TESTING_PATH, USERS_PATH } from '../../../core/paths/paths';
import { generateBasicAuthToken } from '../../utils/generateBasicAuthToken';
import { createFakePost } from '../../utils/posts/create-fake-post';
import { db } from '../../../db/mongo.db';
import { SETTINGS } from '../../../core/settings/settings';
import { createFakeBlog } from '../../utils/blogs/create-fake-blog';
import { createFakeUser } from '../../utils/users/create-fake-user';
import { runDb } from '../../../db/mongoose.db';
import mongoose from 'mongoose';

describe('Comment API', () => {
  const app = express();
  setupApp(app);

  beforeAll(async () => {
    await db.run(SETTINGS.MONGO_URL);
    await runDb(SETTINGS.MONGO_URL);

    await request(app)
      .delete(TESTING_PATH + '/all-data')
      .expect(HttpStatus.NoContent);
  });

  afterAll(async () => {
    await db.stop();
    await mongoose.disconnect();
  });

  it('should change status to value "like"; PUT comments', async () => {
    // создание блога -> поста
    const createdBlog = await request(app)
      .post(BLOGS_PATH)
      .set('Authorization', generateBasicAuthToken())
      .send(createFakeBlog())
      .expect(HttpStatus.Created);

    const createdPost = await request(app)
      .post(POSTS_PATH)
      .set('Authorization', generateBasicAuthToken())
      .send(createFakePost(createdBlog.body.id))
      .expect(HttpStatus.Created);

    // создание пользователя
    const newUser = createFakeUser('1');

    await request(app)
      .post(USERS_PATH)
      .set('Authorization', generateBasicAuthToken())
      .send(newUser)
      .expect(HttpStatus.Created);

    const loginResponse = await request(app)
      .post(AUTH_PATH + '/login')
      .send({ loginOrEmail: newUser.email, password: newUser.password })
      .expect(HttpStatus.Ok);

    // создание комментария
    const createdComment = await request(app)
      .post(POSTS_PATH + `/${createdPost.body.id}` + '/comments')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .send({ content: 'a'.repeat(25) })
      .expect(HttpStatus.Created);

    await request(app)
      .get(COMMENTS_PATH + `/${createdComment.body.id}`)
      .expect(HttpStatus.Ok);

    // редактирование комментария ==== поставить лайк
    await request(app)
      .put(COMMENTS_PATH + `/${createdComment.body.id}` + '/like-status')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .send({ likeStatus: 'Like' })
      .expect(HttpStatus.NoContent);

    // запрос коммента с новым статусом
    const res2 = await request(app)
      .get(COMMENTS_PATH + `/${createdComment.body.id}`)
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(HttpStatus.Ok);

    // console.log(res2.body);

    // получение всех комментариев к посту с моими статусами
    const comments = await request(app)
      .get(POSTS_PATH + `/${createdPost.body.id}` + '/comments')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(HttpStatus.Ok);

    // console.log(comments.body.items);

    // удаление комментария
    await request(app)
      .del(COMMENTS_PATH + `/${createdComment.body.id}`)
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(HttpStatus.NoContent);

    await request(app)
      .get(COMMENTS_PATH + `/${createdComment.body.id}`)
      .expect(HttpStatus.NotFound);
  });
});
