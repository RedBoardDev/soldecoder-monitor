import type { ILogger, LoggerConfig, LogLevel } from './types';
import { LOG_LEVELS } from './types';

/**
 * Simple, clean logger implementation
 */
export class Logger implements ILogger {
  private level: number;
  private enableTimestamp: boolean;
  private enableColors: boolean;

  constructor(config: LoggerConfig = { level: 'info' }) {
    this.level = LOG_LEVELS[config.level];
    this.enableTimestamp = config.enableTimestamp ?? true;
    this.enableColors = config.enableColors ?? true;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= this.level;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = this.enableTimestamp ? new Date().toISOString() : '';
    const levelStr = level.toUpperCase().padEnd(5);

    if (this.enableTimestamp) {
      return `[${timestamp}] ${levelStr} ${message}`;
    }

    return `${levelStr} ${message}`;
  }

  private getColorCode(level: LogLevel): string {
    if (!this.enableColors) return '';

    const colors = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m', // Green
      warn: '\x1b[33m', // Yellow
      error: '\x1b[31m', // Red
    };

    return colors[level] || '';
  }

  private resetColor(): string {
    return this.enableColors ? '\x1b[0m' : '';
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      const formatted = this.formatMessage('debug', message);
      const colorCode = this.getColorCode('debug');
      console.debug(`${colorCode}${formatted}${this.resetColor()}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      const formatted = this.formatMessage('info', message);
      const colorCode = this.getColorCode('info');
      console.info(`${colorCode}${formatted}${this.resetColor()}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      const formatted = this.formatMessage('warn', message);
      const colorCode = this.getColorCode('warn');
      console.warn(`${colorCode}${formatted}${this.resetColor()}`, ...args);
    }
  }

  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      const formatted = this.formatMessage('error', message);
      const colorCode = this.getColorCode('error');
      console.error(`${colorCode}${formatted}${this.resetColor()}`);

      if (error) {
        console.error(error);
      }

      if (context && Object.keys(context).length > 0) {
        console.error('Context:', context);
      }
    }
  }

  /**
   * Sets the log level
   */
  setLevel(level: LogLevel): void {
    this.level = LOG_LEVELS[level];
  }

  /**
   * Gets the current log level
   */
  getLevel(): LogLevel {
    const entries = Object.entries(LOG_LEVELS);
    const levelEntry = entries.find(([, value]) => value === this.level);
    return (levelEntry?.[0] as LogLevel) || 'info';
  }
}
