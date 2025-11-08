import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Create a logs folder if it doesn't exist
const logDir = path.join(__dirname, '../../logs');

const dailyRotateFileTransport = new DailyRotateFile({
  filename: path.join(logDir, 'app-%DATE%.log'),  // logs/app-2025-04-26.log
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,        // compress old logs
  maxSize: '80m',             // max size per log file
  maxFiles: '40d',            // keep logs for 14 days
  level: 'info',
});

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
    }),
  ),
  transports: [
    new transports.Console(), // log to console
    dailyRotateFileTransport, // log to daily file
  ],
});

export default logger;
