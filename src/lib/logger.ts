import config from '@app/config';

type LogLevel = 'log' | 'info' | 'warn' | 'error';

interface LogLevelInformation {
  label: string;
}

interface Logger {
  log(message: string, ...optionalParams: unknown[]): void;
  info(message: string, ...optionalParams: unknown[]): void;
  warn(message: string, ...optionalParams: unknown[]): void;
  error(message: string, ...optionalParams: unknown[]): void;
}

export class ConsoleLogger implements Logger {
  private projectPrefix: string;

  constructor(projectPrefix: string) {
    this.projectPrefix = projectPrefix;
  }

  private logLevels: Record<LogLevel, LogLevelInformation> = {
    log: { label: 'LOG:' },
    info: { label: 'INFO:' },
    warn: { label: 'WARN:' },
    error: { label: 'ERROR:' },
  };

  private formatMessage(
    level: LogLevel,
    message: string,
    optionalParams: unknown[],
  ): [string, ...unknown[]] {
    const timestamp = new Date().toISOString();
    const { label } = this.logLevels[level];
    return [
      `${this.projectPrefix}: [${timestamp}] ${label} ${message}`,
      ...optionalParams,
    ];
  }

  log(message: string, ...optionalParams: unknown[]): void {
    console.log(...this.formatMessage('log', message, optionalParams));
  }

  info(message: string, ...optionalParams: unknown[]): void {
    console.info(...this.formatMessage('info', message, optionalParams));
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    console.warn(...this.formatMessage('warn', message, optionalParams));
  }

  error(message: string, ...optionalParams: unknown[]): void {
    console.error(...this.formatMessage('error', message, optionalParams));
  }
}

export const logger: Logger = new ConsoleLogger(config.PLUGIN_NAME);
