/**
 * Structured logging utility
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogContext {
  [key: string]: any;
}

class Logger {
  private minLevel: LogLevel;

  constructor() {
    const level = process.env.LOG_LEVEL?.toLowerCase() || 'info';
    this.minLevel = level as LogLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(LogLevel.INFO, message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, context));
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext = error instanceof Error
        ? { ...context, error: error.message, stack: error.stack }
        : context;
      console.error(this.formatMessage(LogLevel.ERROR, message, errorContext));
    }
  }

  child(defaultContext: LogContext): Logger {
    const childLogger = new Logger();
    const originalMethods = {
      debug: childLogger.debug.bind(childLogger),
      info: childLogger.info.bind(childLogger),
      warn: childLogger.warn.bind(childLogger),
      error: childLogger.error.bind(childLogger),
    };

    childLogger.debug = (message, context?) =>
      originalMethods.debug(message, { ...defaultContext, ...context });
    childLogger.info = (message, context?) =>
      originalMethods.info(message, { ...defaultContext, ...context });
    childLogger.warn = (message, context?) =>
      originalMethods.warn(message, { ...defaultContext, ...context });
    childLogger.error = (message, error?, context?) =>
      originalMethods.error(message, error, { ...defaultContext, ...context });

    return childLogger;
  }
}

export const logger = new Logger();
