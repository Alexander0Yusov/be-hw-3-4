import { Db, MongoClient } from 'mongodb';

import { SETTINGS } from '../core/settings/settings';
import { Blog } from '../1-blogs/types/blog';
import { Post } from '../2-posts/types/post';
import { User } from '../4-users/types/user';
import { Comment } from '../6-comments/types/comment';
import { DeviceSession } from '../7-security/types/device-session';
import { RequestLog } from '../7-security/types/request-log';

export const db = {
  client: {} as MongoClient,

  getDbName(): Db {
    return this.client.db(SETTINGS.DB_NAME);
  },

  async run(url: string) {
    try {
      this.client = new MongoClient(url);
      await this.client.connect();
      await this.getDbName().command({ ping: 1 });
      console.log('✅ Connected to the database');
    } catch (e: unknown) {
      console.error(`❌ Database not connected: ${e}`);
      await this.client.close();
    }
  },

  async stop() {
    await this.client.close();
    console.log('✅ Connection successful closed');
  },

  async drop() {
    try {
      //await this.getDbName().dropDatabase()
      const collections = await this.getDbName().listCollections().toArray();

      for (const collection of collections) {
        const collectionName = collection.name;
        await this.getDbName().collection(collectionName).deleteMany({});
      }
    } catch (e: unknown) {
      console.error('Error in drop db:', e);
      await this.stop();
    }
  },

  getCollections() {
    return {
      userCollection: this.getDbName().collection<User>('users'),
      blogCollection: this.getDbName().collection<Blog>('blogs'),
      postCollection: this.getDbName().collection<Post>('posts'),
      commentCollection: this.getDbName().collection<Comment>('comments'),
      sessionCollection: this.getDbName().collection<DeviceSession>('sessions'),
      requestlogCollection: this.getDbName().collection<RequestLog>('requestlog'),
    };
  },
};
