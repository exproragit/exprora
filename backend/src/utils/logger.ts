/**
 * Structured logging utility
 */
interface LogContext {
  requestId?: string;
  accountId?: number;
  userId?: number;
  [key: string]: any;
}

class Logger {
  private formatMessage(level: string, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    return {
      timestamp,
      level,
      message,
      ...context,
    };
  }

  info(message: string, context?: LogContext) {
    console.log(JSON.stringify(this.formatMessage('INFO', message, context)));
  }

  error(message: string, error?: Error, context?: LogContext) {
    const errorContext = {
      ...context,
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      },
    };
    console.error(JSON.stringify(this.formatMessage('ERROR', message, errorContext)));
  }

  warn(message: string, context?: LogContext) {
    console.warn(JSON.stringify(this.formatMessage('WARN', message, context)));
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(JSON.stringify(this.formatMessage('DEBUG', message, context)));
    }
  }
}

export const logger = new Logger();

