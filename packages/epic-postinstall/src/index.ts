#!/usr/bin/env node

import { getConfig } from './getConfig/index.js';
import { getSystemInfo } from './getSystemInfo/index.js';
import { LogLevel, setLogLevel, error, info } from './logger/index.js';

const run = async () => {
  const args = process.argv.slice(2);
  const isUninstall = args.includes("--uninstall");
  const isVerbose = args.includes("--verbose");
  const isDebug = args.includes("--debug");

  if (isDebug) {
    setLogLevel(LogLevel.DEBUG);
  } else if (isVerbose) {
    setLogLevel(LogLevel.INFO);
  } else {
    setLogLevel(LogLevel.ERROR); // Default to only showing errors if no flags are set
  }

  try {
    info('Loading epic-postinstall configuration...');
    const config = getConfig();

    info('\nDetecting system information...');
    const systemInfo = getSystemInfo();
    info('System Information:');
    info(JSON.stringify(systemInfo, null, 2));

    if (isUninstall) {
      info("Uninstalling epic-postinstall...");
    } else {
      info('\nConfiguration loaded successfully:');
      info(JSON.stringify(config, null, 2));
    }
  } catch (err) {
    error(`Error: ${(err as Error).message}`);
    process.exit(1);
  }
}

run();