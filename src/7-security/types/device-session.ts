export type DeviceSession = {
  userId: string;
  deviceId: string;
  ip: string;
  deviceName: string; // из user-agent (или дефолт)
  lastActiveDate: Date; // обновляем при ротации refresh
  expiresAt: Date; // дата окончания действия refresh
};
