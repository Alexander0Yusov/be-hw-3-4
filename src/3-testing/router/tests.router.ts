import { Request, Response, Router } from 'express';
import { HttpStatus } from '../../core/types/HttpStatus';
import { db } from '../../db/mongo.db';
import { clearDb } from '../../db/mongoose.db';

export const testRouter = Router({});

testRouter.delete('/all-data', async (req: Request, res: Response) => {
  //truncate db
  await Promise.all([
    db.getCollections().blogCollection.deleteMany(),
    db.getCollections().postCollection.deleteMany(),
    db.getCollections().userCollection.deleteMany(),
    db.getCollections().commentCollection.deleteMany(),
  ]);

  await clearDb();

  res.sendStatus(HttpStatus.NoContent);
});
