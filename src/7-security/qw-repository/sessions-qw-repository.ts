import { injectable } from 'inversify';
import { db } from '../../db/mongo.db';
import { DeviceViewModel } from '../types/device-view-model';

@injectable()
export class SessionsQwRepository {
  async findMany(userId: string): Promise<DeviceViewModel[]> {
    const items = await db
      .getCollections()
      .sessionCollection.find({
        userId,
        expiresAt: { $gt: new Date() },
      })
      .sort({ lastActiveDate: -1 })
      .toArray();

    return items.map((item) => ({
      ip: item.ip,
      title: item.deviceName,
      lastActiveDate: item.lastActiveDate.toISOString(),
      deviceId: item.deviceId,
    }));
  }
}
