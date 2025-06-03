#!/usr/bin/env node

import { getConfig } from './getConfig/index.js';
import { getSystemInfo } from './getSystemInfo/index.js';

async function run() {
  const args = process.argv.slice(2);
  const isUninstall = args.includes("--uninstall");

  try {
    console.log('Loading epic-postinstall configuration...');
    const config = getConfig();

    console.log('\nDetecting system information...');
    const systemInfo = getSystemInfo();
    console.log('System Information:');
    console.log(JSON.stringify(systemInfo, null, 2));

    if (isUninstall) {
      console.log("Uninstalling epic-postinstall...");
    } else {
      console.log('\nConfiguration loaded successfully:');
      console.log(JSON.stringify(config, null, 2));
    }
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

run();