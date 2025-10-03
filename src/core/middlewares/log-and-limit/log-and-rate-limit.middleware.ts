import { Request, Response, NextFunction } from 'express';
import { logLimitRepository } from './log-limit.repository';

export const logAndRateLimitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip;
  const url = req.originalUrl;
  const now = new Date();

  const logData = {
    ip: ip || '',
    url,
    date: now,
  };

  // Логируем обращение
  await logLimitRepository.create(logData);

  // Считаем количество обращений за последние 10 секунд
  const tenSecondsAgo = new Date(now.getTime() - 10_000);

  const recentCount = await logLimitRepository.countDocumentsFromIpToUrl(ip || '', url, tenSecondsAgo);

  console.log(`[${ip}] -> ${url} | Count in last 10s: ${recentCount}`);
  // ограничение
  if (recentCount > 5) {
    return res.status(429).send('Too many requests');
  }

  next();
};
