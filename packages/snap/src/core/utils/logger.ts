/* eslint-disable @typescript-eslint/no-empty-function */
/**
 * A simple logger utility that provides methods for logging messages at different levels.
 * For now, it's just a wrapper around console.
 *
 * @namespace logger
 */

import { logMaybeSolanaError } from './logMaybeSolanaError';

export type ILogger = {
  log: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug: (...args: any[]) => void;
};

const withSolanaErrorLogging =
  (logFn: (...args: any[]) => void) =>
  (...args: any[]) => {
    logMaybeSolanaError(args[0]);
    logFn(...args);
  };

/**
 * A decorator function that noops if the environment is not local,
 * and runs the decorated function otherwise.
 *
 * @param fn - The function to wrap.
 * @returns The wrapped function.
 */
const withNoopInProduction =
  (fn: (...args: any[]) => void) =>
  (...args: any[]) => {
    // eslint-disable-next-line no-restricted-globals
    if (process.env.ENVIRONMENT === 'production') {
      return;
    }
    fn(...args);
  };

/**
 * A basic logger that wraps the console, extending its functionality to properly log Solana errors.
 */
const logger: ILogger = {
  log: withNoopInProduction(console.log),
  info: withNoopInProduction(console.info),
  warn: withNoopInProduction(console.warn),
  debug: withNoopInProduction(console.debug),
  error: withNoopInProduction(withSolanaErrorLogging(console.error)),
};

export const noOpLogger: ILogger = {
  log: () => {},
  info: () => {},
  warn: () => {},
  debug: () => {},
  error: () => {},
};

export const createPrefixedLogger = (
  _logger: ILogger,
  prefix: string,
): ILogger => {
  return new Proxy(_logger, {
    get(target, prop: keyof ILogger) {
      const method = target[prop];
      if (typeof method === 'function') {
        return (message: string, ...args: any[]) => {
          return method.call(target, prefix, message, ...args);
        };
      }
      return method;
    },
  });
};

export default logger;
