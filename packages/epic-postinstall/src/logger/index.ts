/**
 * Defines the available logging levels.
 * - ERROR: Only critical errors are logged.
 * - WARN: Warnings and errors are logged.
 * - INFO: General information, warnings, and errors are logged (default).
 * - DEBUG: Detailed debug messages, info, warnings, and errors are logged.
 */
export enum LogLevel {
  DEBUG = 0, // All messages (debug, verbose, info, warn, error)
  VERBOSE = 1, // Verbose, info, warn, error
  INFO = 2, // Info, warn, error (default)
  WARN = 3, // Warn, error
  ERROR = 4, // Only errors
  NONE = 5, // No logs
  SUCCESS = 6, // Always displayed, for success messages
}

let currentLogLevel: LogLevel = LogLevel.INFO;

export interface Logger {
  debug: (...args: unknown[]) => void;
  verbose: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  success: (...args: unknown[]) => void; // New success log type
  setLogLevel: (level: LogLevel) => void;
}

const logger: Logger = {
  /**
   * Sets the global logging level. Messages with a level higher than the set level will not be displayed.
   * @param level The desired LogLevel.
   * @example
   * logger.setLogLevel(LogLevel.DEBUG); // Enable all logs
   * logger.setLogLevel(LogLevel.ERROR); // Only show errors
   */
  setLogLevel: (level: LogLevel) => {
    currentLogLevel = level;
  },

  /**
   * Logs a debug message to the console. Displayed only if log level is DEBUG.
   * Use for detailed internal process information.
   * @param args The messages or objects to log.
   * @example
   * logger.debug('Processing user input:', userInput);
   */
  debug: (...args: unknown[]) => {
    if (currentLogLevel <= LogLevel.DEBUG) console.debug('[DEBUG]', ...args);
  },

  /**
   * Logs a verbose message to the console. Displayed if log level is VERBOSE or DEBUG.
   * Use for more detailed information than INFO, but less than DEBUG.
   * @param args The messages or objects to log.
   * @example
   * logger.verbose('Starting module initialization.');
   */
  verbose: (...args: unknown[]) => {
    if (currentLogLevel <= LogLevel.VERBOSE) console.log('[VERBOSE]', ...args);
  },

  /**
   * Logs an informational message to the console. Displayed if log level is INFO, WARN, ERROR, VERBOSE, or DEBUG.
   * This is the default logging level.
   * @param args The messages or objects to log.
   * @example
   * logger.info('Application started successfully.');
   */
  info: (...args: unknown[]) => {
    if (currentLogLevel <= LogLevel.INFO) console.info('[INFO]', ...args);
  },

  /**
   * Logs a warning message to the console. Displayed if log level is WARN, ERROR, VERBOSE, or DEBUG.
   * @param args The messages or objects to log.
   * @example
   * logger.warn('This operation might have unintended side effects.');
   */
  warn: (...args: unknown[]) => {
    if (currentLogLevel <= LogLevel.WARN) console.warn('\x1b[33m[WARN]', ...args, '\x1b[0m'); // Yellow
  },

  /**
   * Logs an error message to the console. These messages are always displayed if log level is ERROR, WARN, INFO, VERBOSE, or DEBUG.
   * @param args The messages or objects to log.
   * @example
   * logger.error('Something critical happened!');
   */
  error: (...args: unknown[]) => {
    if (currentLogLevel <= LogLevel.ERROR) console.error('\x1b[31m[ERROR]', ...args, '\x1b[0m'); // Red
  },

  /**
   * Logs a success message to the console. These messages are always displayed.
   * @param args The messages or objects to log.
   * @example
   * logger.success('Operation completed successfully!');
   */
  success: (...args: unknown[]) => {
    console.log('\x1b[32m[SUCCESS]', ...args, '\x1b[0m'); // Green
  },
};

export default logger;