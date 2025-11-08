import { Request, Response, NextFunction } from 'express';
import logger from '../../utils/logger';
import { UAParser } from 'ua-parser-js';

const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const method = req.method;
  const url = req.originalUrl;
  const userAgentString = req.headers['user-agent'] || 'Unknown';

  const parser = new UAParser(userAgentString as string);
  const browser = parser.getBrowser().name || 'Unknown Browser';
  const os = parser.getOS().name || 'Unknown OS';
  const userId = (req as any).user?.id || 'Guest';

  const logMessage = `${method} ${url} | IP: ${ip} | Browser: ${browser} | OS: ${os} | User-Agent: ${userAgentString} | User: ${userId}`;

  console.log('Parsed User-Agent:', browser, os); // 👈 now you see parsed results
  logger.info(logMessage);

  next();
};

export default loggerMiddleware;
