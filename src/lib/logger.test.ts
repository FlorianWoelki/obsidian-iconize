import { beforeEach, describe, it, expect, vi, afterEach, Mock } from 'vitest';
import { ConsoleLogger } from './logger';

describe('ConsoleLogger', () => {
  let mockConsole: Record<string, Mock>;
  const now = new Date();

  beforeEach(() => {
    mockConsole = {
      log: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    console = mockConsole as any;

    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should log a basic message', () => {
    const logger = new ConsoleLogger('TestPrefix', true);
    logger.log('Test message');

    expect(mockConsole.log).toHaveBeenCalledWith(
      `TestPrefix: [${now.toISOString()}] LOG: Test message`,
    );
  });

  it('should log a info message', () => {
    const logger = new ConsoleLogger('TestPrefix', true);
    logger.info('Test message');

    expect(mockConsole.info).toHaveBeenCalledWith(
      `TestPrefix: [${now.toISOString()}] INFO: Test message`,
    );
  });

  it('should log a warn message', () => {
    const logger = new ConsoleLogger('TestPrefix', true);
    logger.warn('Test message');

    expect(mockConsole.warn).toHaveBeenCalledWith(
      `TestPrefix: [${now.toISOString()}] WARN: Test message`,
    );
  });

  it('should log an error message', () => {
    const logger = new ConsoleLogger('TestPrefix', true);
    logger.error('Test message');

    expect(mockConsole.error).toHaveBeenCalledWith(
      `TestPrefix: [${now.toISOString()}] ERROR: Test message`,
    );
  });

  it('should log with optional parameters', () => {
    const logger = new ConsoleLogger('TestPrefix', true);
    logger.warn('Test message', { data: 123 });

    expect(mockConsole.warn).toHaveBeenCalledWith(
      `TestPrefix: [${now.toISOString()}] WARN: Test message`,
      { data: 123 },
    );
  });

  it('should not log when logging is disabled', () => {
    const logger = new ConsoleLogger('TestPrefix', false);
    logger.log('Test message');

    expect(mockConsole.log).not.toHaveBeenCalled();
    expect(mockConsole.info).not.toHaveBeenCalled();
    expect(mockConsole.warn).not.toHaveBeenCalled();
    expect(mockConsole.error).not.toHaveBeenCalled();
  });

  it('should log when logging is enabled after being disabled', () => {
    const logger = new ConsoleLogger('TestPrefix', false);
    logger.log('Test message');
    expect(mockConsole.log).not.toHaveBeenCalled();

    logger.toggleLogging(true);
    logger.log('Test message');

    expect(mockConsole.log).toHaveBeenCalledWith(expect.any(String));
  });

  it('should log when logging is disabled after being enabled', () => {
    const logger = new ConsoleLogger('TestPrefix', true);
    logger.log('Test message');
    expect(mockConsole.log).toHaveBeenCalledWith(expect.any(String));

    logger.toggleLogging(false);
    logger.log('Test message');

    expect(mockConsole.log).toHaveBeenCalledTimes(1);
  });
});
