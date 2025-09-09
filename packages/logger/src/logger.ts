import * as fs from 'fs';
import * as path from 'path';
import type { ILogger, LoggerConfig, LogLevel } from './types';
import { LOG_LEVELS } from './types';

/**
 * Simple, clean logger implementation with Singleton pattern
 */
export class Logger implements ILogger {
  private static instance: Logger | null = null;
  private level: number;
  private enableTimestamp: boolean;
  private enableColors: boolean;
  private enableFileLogging: boolean;
  private logDirectory: string;
  private maxFileSize: number;
  private maxFiles: number;

  constructor(config: LoggerConfig = { level: 'info' }) {
    this.level = LOG_LEVELS[config.level];
    this.enableTimestamp = config.enableTimestamp ?? true;
    this.enableColors = config.enableColors ?? true;
    this.enableFileLogging = config.enableFileLogging ?? true;
    this.logDirectory = config.logDirectory ?? path.join(process.cwd(), 'logs');
    this.maxFileSize = config.maxFileSize ?? 10 * 1024 * 1024; // 10MB par défaut
    this.maxFiles = config.maxFiles ?? 5;

    // Créer le répertoire de logs s'il n'existe pas
    if (this.enableFileLogging) {
      this.ensureLogDirectoryExists();
    }
  }

  /**
   * Get singleton instance with default config
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Create a new custom instance (bypasses singleton)
   */
  public static createInstance(config: LoggerConfig): Logger {
    return new Logger(config);
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  public static resetInstance(): void {
    Logger.instance = null;
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

  private ensureLogDirectoryExists(): void {
    try {
      if (!fs.existsSync(this.logDirectory)) {
        fs.mkdirSync(this.logDirectory, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  private getLogFilePath(): string {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return path.join(this.logDirectory, `${today}.log`);
  }

  private formatMessageForFile(level: LogLevel, message: string, context?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5);
    let logEntry = `[${timestamp}] ${levelStr} ${message}`;

    if (context && Object.keys(context).length > 0) {
      logEntry += ` | Context: ${JSON.stringify(context)}`;
    }

    return logEntry;
  }

  private writeToFile(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (!this.enableFileLogging) return;

    try {
      const logEntry = this.formatMessageForFile(level, message, context);
      const logFilePath = this.getLogFilePath();

      // Écrire de manière asynchrone pour ne pas bloquer
      fs.appendFile(logFilePath, logEntry + '\n', (err) => {
        if (err) {
          console.error('Failed to write to log file:', err);
        }
      });
    } catch (error) {
      console.error('Error writing to log file:', error);
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('debug')) {
      const formatted = this.formatMessage('debug', message);
      const colorCode = this.getColorCode('debug');
      console.debug(`${colorCode}${formatted}${this.resetColor()}`);

      if (context && Object.keys(context).length > 0) {
        console.debug('Context:', context);
      }

      // Écrire dans le fichier de logs avec le contexte
      this.writeToFile('debug', message, context);
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      const formatted = this.formatMessage('info', message);
      const colorCode = this.getColorCode('info');
      console.info(`${colorCode}${formatted}${this.resetColor()}`);

      if (context && Object.keys(context).length > 0) {
        console.info('Context:', context);
      }

      // Écrire dans le fichier de logs avec le contexte
      this.writeToFile('info', message, context);
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) {
      const formatted = this.formatMessage('warn', message);
      const colorCode = this.getColorCode('warn');
      console.warn(`${colorCode}${formatted}${this.resetColor()}`);

      if (context && Object.keys(context).length > 0) {
        console.warn('Context:', context);
      }

      // Écrire dans le fichier de logs avec le contexte
      this.writeToFile('warn', message, context);
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

      // Écrire dans le fichier de logs avec le contexte
      let errorMessage = message;
      if (error) {
        errorMessage += ` | Error: ${error instanceof Error ? error.message : String(error)}`;
      }
      this.writeToFile('error', errorMessage, context);
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
