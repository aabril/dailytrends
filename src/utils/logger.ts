import pino from 'pino';
import { config } from '../config/config.js';

// Create the logger instance with Pino
const logger = pino({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  transport: config.nodeEnv === 'production' ? undefined : {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  },
  // Production configuration
  ...(config.nodeEnv === 'production' && {
    formatters: {
      level: (label) => {
        return { level: label };
      }
    }
  })
});

export const Logger = {
  error: (message: string, meta?: any) => {
    logger.error(message, meta);
  },
  
  warn: (message: string, meta?: any) => {
    logger.warn(message, meta);
  },
  
  info: (message: string, meta?: any) => {
    logger.info(message, meta);
  },
  
  debug: (message: string, meta?: any) => {
    logger.debug(message, meta);
  }

};

export default Logger;