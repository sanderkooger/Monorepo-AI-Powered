/**
 * Defines the available logging levels.
 * - ERROR: Only critical errors are logged.
 * - WARN: Warnings and errors are logged.
 * - INFO: General information, warnings, and errors are logged (default).
 * - DEBUG: Detailed debug messages, info, warnings, and errors are logged.
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

let currentLogLevel: LogLevel = LogLevel.INFO;

/**
 * Sets the global logging level. Messages with a level lower than the set level will not be displayed.
 * @param level The desired LogLevel.
 * @example
 * setLogLevel(LogLevel.DEBUG); // Enable all logs
 * setLogLevel(LogLevel.ERROR); // Only show errors
 */
export const setLogLevel = (level: LogLevel) => {
  currentLogLevel = level;
};

/**
 * Logs a debug message to the console. Displayed only if log level is DEBUG.
 * Use for detailed internal process information.
 * @param args The messages or objects to log.
 * @example
 * debug('Processing user input:', userInput);
 */
export const debug = (...args: unknown[]) => {
  if (currentLogLevel <= LogLevel.DEBUG) console.debug('[DEBUG]', ...args);
};

/**
 * Logs an informational message to the console. Displayed if log level is INFO, WARN, or ERROR.
 * This is the default logging level.
 * @param args The messages or objects to log.
 * @example
 * info('Application started successfully.');
 */
export const info = (...args: unknown[]) => {
  if (currentLogLevel <= LogLevel.INFO) console.info('[INFO]', ...args);
};

/**
 * Logs a warning message to the console. Displayed if log level is WARN or ERROR.
 * @param args The messages or objects to log.
 * @example
 * warn('This operation might have unintended side effects.');
 */
export const warn = (...args: unknown[]) => {
  if (currentLogLevel <= LogLevel.WARN) console.warn('[WARN]', ...args);
};

/**
 * Logs an error message to the console. These messages are always displayed.
 * @param args The messages or objects to log.
 * @example
 * error('Something critical happened!');
 */
export const error = (...args: unknown[]) => {
  if (currentLogLevel <= LogLevel.ERROR) console.error('[ERROR]', ...args);
};