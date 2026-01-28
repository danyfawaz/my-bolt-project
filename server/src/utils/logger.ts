import config from '../../config/default';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = LOG_LEVELS[config.logging.level as LogLevel] || LOG_LEVELS.info;

function formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';

  if (config.logging.pretty) {
    const colors: Record<LogLevel, string> = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m',  // green
      warn: '\x1b[33m',  // yellow
      error: '\x1b[31m', // red
    };
    const reset = '\x1b[0m';
    return `${colors[level]}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}${metaStr}`;
  }

  return JSON.stringify({
    timestamp,
    level,
    message,
    ...meta,
  });
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= currentLevel;
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>) {
    if (shouldLog('debug')) {
      console.log(formatMessage('debug', message, meta));
    }
  },

  info(message: string, meta?: Record<string, unknown>) {
    if (shouldLog('info')) {
      console.log(formatMessage('info', message, meta));
    }
  },

  warn(message: string, meta?: Record<string, unknown>) {
    if (shouldLog('warn')) {
      console.warn(formatMessage('warn', message, meta));
    }
  },

  error(message: string, meta?: Record<string, unknown>) {
    if (shouldLog('error')) {
      console.error(formatMessage('error', message, meta));
    }
  },

  // Log with correlation ID for tracing
  withCorrelation(correlationId: string) {
    return {
      debug: (message: string, meta?: Record<string, unknown>) =>
        logger.debug(message, { ...meta, correlation_id: correlationId }),
      info: (message: string, meta?: Record<string, unknown>) =>
        logger.info(message, { ...meta, correlation_id: correlationId }),
      warn: (message: string, meta?: Record<string, unknown>) =>
        logger.warn(message, { ...meta, correlation_id: correlationId }),
      error: (message: string, meta?: Record<string, unknown>) =>
        logger.error(message, { ...meta, correlation_id: correlationId }),
    };
  },
};

export default logger;
