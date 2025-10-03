import { db } from '../../../db/mongo.db';
import { RequestLog } from '../../../7-security/types/request-log';

export const logLimitRepository = {
  async create(logData: RequestLog): Promise<string> {
    const result = await db.getCollections().requestlogCollection.insertOne(logData);

    return result.insertedId.toString();
  },

  async countDocumentsFromIpToUrl(ip: string, url: string, timeAgo: Date): Promise<number> {
    return await db.getCollections().requestlogCollection.countDocuments({ ip, url, date: { $gte: timeAgo } });
  },
};
