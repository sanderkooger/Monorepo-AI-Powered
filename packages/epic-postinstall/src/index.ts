#!/usr/bin/env node

import { loadConfig } from './config-loader/index.js';

async function run() {
  const args = process.argv.slice(2);
  const isUninstall = args.includes("--uninstall");

  console.log('Loading epic-postinstall configuration...');
  const config = loadConfig();

  if (isUninstall) {
    console.log("Uninstalling epic-postinstall...");
  } else {
    if (config) {
      console.log('Configuration loaded successfully:');
      console.log(JSON.stringify(config, null, 2));
    } else {
      console.log('No epic-postinstall configuration found.');
    }
  }
}

run();