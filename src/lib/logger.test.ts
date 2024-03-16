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
    const logger = new ConsoleLogger('TestPrefix');
    logger.log('Test message');

    expect(mockConsole.log).toHaveBeenCalledWith(
      `TestPrefix: [${now.toISOString()}] LOG: Test message`,
    );
  });

  it('should log a info message', () => {
    const logger = new ConsoleLogger('TestPrefix');
    logger.info('Test message');

    expect(mockConsole.info).toHaveBeenCalledWith(
      `TestPrefix: [${now.toISOString()}] INFO: Test message`,
    );
  });

  it('should log a warn message', () => {
    const logger = new ConsoleLogger('TestPrefix');
    logger.warn('Test message');

    expect(mockConsole.warn).toHaveBeenCalledWith(
      `TestPrefix: [${now.toISOString()}] WARN: Test message`,
    );
  });

  it('should log an error message', () => {
    const logger = new ConsoleLogger('TestPrefix');
    logger.error('Test message');

    expect(mockConsole.error).toHaveBeenCalledWith(
      `TestPrefix: [${now.toISOString()}] ERROR: Test message`,
    );
  });

  it('should log with optional parameters', () => {
    const logger = new ConsoleLogger('TestPrefix');
    logger.warn('Test message', { data: 123 });

    expect(mockConsole.warn).toHaveBeenCalledWith(
      `TestPrefix: [${now.toISOString()}] WARN: Test message`,
      { data: 123 },
    );
  });
});
