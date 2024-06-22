import config from '@app/config';

export enum LoggerPrefix {
  Outline = 'Outline',
}

type LogLevel = 'log' | 'info' | 'warn' | 'error';

interface LogLevelInformation {
  label: string;
}

interface Logger {
  log(
    message: string,
    prefix?: LoggerPrefix,
    ...optionalParams: unknown[]
  ): void;
  info(
    message: string,
    prefix?: LoggerPrefix,
    ...optionalParams: unknown[]
  ): void;
  warn(
    message: string,
    prefix?: LoggerPrefix,
    ...optionalParams: unknown[]
  ): void;
  error(
    message: string,
    prefix?: LoggerPrefix,
    ...optionalParams: unknown[]
  ): void;
  toggleLogging(enabled: boolean): void;
}

export class ConsoleLogger implements Logger {
  private projectPrefix: string;
  private enabled: boolean;

  constructor(projectPrefix: string, enabled: boolean = false) {
    this.projectPrefix = projectPrefix;
    this.enabled = enabled;
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
    prefix: LoggerPrefix | null,
    optionalParams: unknown[],
  ): [string, ...unknown[]] {
    const timestamp = new Date().toISOString();
    const { label } = this.logLevels[level];
    const prefixAsStr = !prefix ? '' : `/${prefix}`;
    return [
      `${this.projectPrefix}${prefixAsStr}: [${timestamp}] ${label} ${message}`,
      ...optionalParams,
    ];
  }

  log(
    message: string,
    prefix?: LoggerPrefix,
    ...optionalParams: unknown[]
  ): void {
    if (this.enabled) {
      console.log(
        ...this.formatMessage('log', message, prefix, optionalParams),
      );
    }
  }

  info(
    message: string,
    prefix?: LoggerPrefix,
    ...optionalParams: unknown[]
  ): void {
    if (this.enabled) {
      console.info(
        ...this.formatMessage('info', message, prefix, optionalParams),
      );
    }
  }

  warn(
    message: string,
    prefix?: LoggerPrefix,
    ...optionalParams: unknown[]
  ): void {
    if (this.enabled) {
      console.warn(
        ...this.formatMessage('warn', message, prefix, optionalParams),
      );
    }
  }

  error(
    message: string,
    prefix?: LoggerPrefix,
    ...optionalParams: unknown[]
  ): void {
    if (this.enabled) {
      console.error(
        ...this.formatMessage('error', message, prefix, optionalParams),
      );
    }
  }

  toggleLogging(enabled: boolean): void {
    this.enabled = enabled;
  }
}

export const logger: Logger = new ConsoleLogger(config.PLUGIN_NAME);
