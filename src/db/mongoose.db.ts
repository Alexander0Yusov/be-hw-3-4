import mongoose from 'mongoose';
import { SETTINGS } from '../core/settings/settings';

// for tests
// const dbName = 'home_works';
// `mongodb://0.0.0.0:27017/${dbName}`;

const mongoURI = SETTINGS.MONGO_URL;

export async function runDb(connectionStr = mongoURI) {
  try {
    await mongoose.connect(connectionStr);
    console.log('it is ok. mongoose connection');
  } catch (e) {
    console.log('no connection. mongoose');
    await mongoose.disconnect();
  }
}

export async function clearDb() {
  const collections = await mongoose.connection.db?.listCollections().toArray(); //.connection.db.listCollections().toArray();

  if (collections) {
    for (const { name } of collections) {
      await mongoose.connection.db?.collection(name).deleteMany({});
    }

    console.log('✅ Все коллекции очищены');
  }
}
