import express from 'express';
import { setupApp } from './setup-app';
import { SETTINGS } from './core/settings/settings';
import { db } from './db/mongo.db';
import { runDb } from './db/mongoose.db';

const bootstrap = async () => {
  const app = express();

  // для получения корректного айпи
  app.set('trust proxy', true);

  setupApp(app);

  const PORT = SETTINGS.PORT;

  await db.run(SETTINGS.MONGO_URL); // нативная часть монго
  await runDb(); // часть соединения монгус

  // для чистки логов автоматически
  await db.getCollections().requestlogCollection.createIndex({ date: 1 }, { expireAfterSeconds: 60 });

  app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`);
  });
};

bootstrap();
