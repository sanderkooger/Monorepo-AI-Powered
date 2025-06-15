import logger, { LogLevel } from '@src/logger/index.js';

export interface ParsedArguments {
  isUninstall: boolean;
  isVerbose: boolean;
  isDebug: boolean;
  isSplash: boolean;
}

export default function argumentParser(args: string[]): ParsedArguments {
  const validFlags = new Set(['--uninstall', '-u', '--verbose', '--debug', '--splash']);
  let isUninstall = false;
  let isVerbose = false;
  let isDebug = false;
  let isSplash = false;

  for (const arg of args) {
    if (!validFlags.has(arg)) {
      logger.error(`Unknown flag: ${arg}`);
      process.exit(1);
    }
    if (arg === '--uninstall' || arg === '-u') {
      isUninstall = true;
    } else if (arg === '--verbose') {
      isVerbose = true;
    } else if (arg === '--debug') {
      isDebug = true;
    } else if (arg === '--splash') {
      isSplash = true;
    }
  }

  return { isUninstall, isVerbose, isDebug, isSplash };
}