#!/usr/bin/env node

function run() {
  const args = process.argv.slice(2);
  const isUninstall = args.includes("--uninstall");

  if (isUninstall) {
    console.log("Uninstalling epic-postinstall...");
  } else {
    console.log("Hello world. (install flag = true)");
  }
}

run();