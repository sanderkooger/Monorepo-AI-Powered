#!/usr/bin/env node

import { getConfig } from './getConfig/index.js';
import { getSystemInfo } from './getSystemInfo/index.js';
import logger, { LogLevel } from './logger/index.js';

const run = async () => {
  const args = process.argv.slice(2);
  const isUninstall = args.includes("--uninstall");
  const isVerbose = args.includes("--verbose");
  const isDebug = args.includes("--debug");

  if (isDebug) {
    logger.setLogLevel(LogLevel.DEBUG);
  } else if (isVerbose) {
    logger.setLogLevel(LogLevel.VERBOSE);
  } else {
    logger.setLogLevel(LogLevel.INFO); // Default to INFO if no flags are set
  }

  try {
    logger.info('Loading epic-postinstall configuration...');
    const config = getConfig();

    logger.info('\nDetecting system information...');
    const systemInfo = getSystemInfo();
    logger.info('System Information:');
    logger.info(JSON.stringify(systemInfo, null, 2));

    if (isUninstall) {
      logger.info("Uninstalling epic-postinstall...");
    } else {
      logger.info('\nConfiguration loaded successfully:');
      logger.verbose(JSON.stringify(config, null, 2));
    }
  } catch (err) {
    logger.error(`Error: ${(err as Error).message}`);
    process.exit(1);
  }
}

run();